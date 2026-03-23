from fastapi import APIRouter, Depends, Request, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import crud
import httpx

router = APIRouter(prefix="/webhook/whatsapp", tags=["whatsapp"])

# ⚠️ TÚ INVENTAS ESTE TOKEN. Es el que debes escribir en la página de configuración de WhatsApp.
VERIFY_TOKEN = "tamagotchi_secreto_123"

@router.get("/")
async def verify_webhook(request: Request):
    """
    Este endpoint GET es obligatorio para que Meta (WhatsApp) verifique que el servidor es tuyo.
    Ellos envían un 'hub.challenge' que debemos devolver intacto en texto plano.
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        print("¡WEBHOOK DE WHATSAPP VERIFICADO EXITOSAMENTE! ✅")
        # Es crucial retornar EXACTAMENTE el challenge en texto plano, sin formato JSON
        return Response(content=challenge, media_type="text/plain")
    
    raise HTTPException(status_code=403, detail="Token no válido")

from typing import Optional

class N8nPayload(BaseModel):
    phone_number: str
    sender_name: str = "Usuario"
    type: str # Valores: 'expense', 'income', 'goal_contribution', o 'chat'
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    goal_name: Optional[str] = None # Identifica a qué meta va el ahorro
    message: Optional[str] = None # Mensaje de aclaración que el LLM genera

@router.post("/interact")
async def receive_n8n_data(payload: N8nPayload, db: Session = Depends(get_db)):
    """
    Este webhook es llamado por N8N después de que su IA
    analizó el mensaje de WhatsApp.
    """
    user = crud.get_or_create_user(db, phone_number=payload.phone_number, name=payload.sender_name)
    
    # 0. Si el LLM solo está charlando o pide aclaración porque faltan datos
    if payload.type == "chat" or payload.amount is None:
        respuesta_ia = payload.message if payload.message else "No logré identificar el monto. ¿Podrías repetirme de cuánto fue?"
        return {"status": "success", "reply": respuesta_ia}
        
    # Reparar usuarios viejos que no tienen su Tamagotchi base
    if not user.tamagotchi:
        nuevo_t = models.Tamagotchi(user_id=user.id)
        db.add(nuevo_t)
        db.commit()
        db.refresh(nuevo_t)
        user.tamagotchi = nuevo_t

    # 1. Lógica si es Gasto
    if payload.type == "expense":
        crud.create_expense(
            db=db, 
            user_id=user.id, 
            amount=payload.amount, 
            category=payload.category,
            description=payload.description
        )
        updated_pet = crud.update_tamagotchi_health(
            db=db, 
            tamagotchi_id=user.tamagotchi.id, 
            user_id=user.id,
            expense_amount=payload.amount,
            expense_category=payload.category
        )
        reply = f"✅ Registrado gasto de ${payload.amount} en {payload.category}.\n"
        reply += f"Tu alcancía '{updated_pet.name}' tiene {updated_pet.health}❤️ y {updated_pet.xp}⭐ de XP."
        return {"status": "success", "reply": reply}

    # 2. Lógica si es Ingreso general
    elif payload.type == "income":
        db_income = models.Income(user_id=user.id, amount=payload.amount, description=payload.description)
        db.add(db_income)
        db.commit()
        return {"status": "success", "reply": f"¡Genial! Ingreso de ${payload.amount} registrado en tu Billeterín seguro."}

    # 3. Lógica si es Ahorro para una Meta / Viaje
    elif payload.type == "goal_contribution":
        nombre_meta = payload.goal_name if payload.goal_name else ""
        goal = crud.get_shared_goal_by_name(db, nombre_meta)
        
        if goal:
            # Registrar el aporte de dinero dentro de los movimientos de la meta (shared_goal_id)
            crud.create_expense(
                db=db, 
                user_id=user.id, 
                amount=payload.amount, 
                category="Ahorro Compartido/Meta",
                description=payload.description if payload.description else f"Aporte vía IA para {goal.name}",
                shared_goal_id=goal.id
            )
            
            # Recompensar fuertemente a la mascota por el buen hábito
            t = user.tamagotchi
            t.xp += 25
            t.happiness = min(100, t.happiness + 10)
            db.commit()
            db.refresh(t)
            
            reply = f"🎯 ¡Excelente hábito! Acabo de sumar ${payload.amount} a tu meta oficial: '{goal.name}'.\n"
            reply += f"¡A tu alcancía le enorgullece verte ahorrar! 🐽💖 (Ganó 25 XP, Total nivelando: {t.xp}⭐)"
            return {"status": "success", "reply": reply}
        else:
            # Validar si el agente inventó un nombre o si fue mal ingresado
            reply = f"🔎 Ups.. no encontré ninguna meta o presupuesto llamado '{nombre_meta}' en tu cuenta."
            return {"status": "success", "reply": reply}

    return {"status": "ignored"}
