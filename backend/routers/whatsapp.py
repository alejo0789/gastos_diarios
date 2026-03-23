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

class WhatsAppPayload(BaseModel):
    phone_number: str
    message: str
    sender_name: str = "Usuario"

# Reemplazar con la URL real de n8n en el futuro
N8N_WEBHOOK_URL = "http://localhost:5678/webhook/finanzas-ai"

async def process_message_with_ai(message: str):
    """
    Se comunica con n8n. n8n recibe el texto, usa IA y devuelve JSON.
    Por ahora lo simulamos.
    """
    try:
        # TODO: Descomentar esto cuando n8n esté activo
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(N8N_WEBHOOK_URL, json={"text": message})
        #     return response.json()
        
        # MOCK SIMULADO para poder avanzar con la programación:
        return {
            "amount": 15000.0,
            "category": "comidas",
            "type": "expense",
            "description": message
        }
    except Exception as e:
        print(f"Error AI: {e}")
        return None

@router.post("/")
async def receive_message(payload: WhatsAppPayload, db: Session = Depends(get_db)):
    # 1. Identificar o crear cuenta
    user = crud.get_or_create_user(db, phone_number=payload.phone_number, name=payload.sender_name)
    
    # 2. Enviar a n8n para análisis NLP
    ai_response = await process_message_with_ai(payload.message)
    
    if not ai_response:
        return {"status": "error", "reply": "La IA no pudo procesar tu mensaje."}
    
    # 3. Guardar gasto y actualizar Mascota
    if ai_response.get("type") == "expense":
        crud.create_expense(
            db=db, 
            user_id=user.id, 
            amount=ai_response["amount"], 
            category=ai_response["category"],
            description=ai_response["description"]
        )
        
        updated_pet = crud.update_tamagotchi_health(
            db=db, 
            tamagotchi_id=user.tamagotchi.id, 
            user_id=user.id,
            expense_amount=ai_response["amount"],
            expense_category=ai_response["category"]
        )
        
        # 4. Formatear la respuesta que el backend le devolvería a Evolution API/WhatsApp
        reply = f"✅ Registré tu gasto de ${ai_response['amount']} en {ai_response['category']}.\n"
        reply += f"Tu mascota '{updated_pet.name}' ahora tiene {updated_pet.health}❤️ y {updated_pet.xp}⭐ de XP."
        
        # TODO: Enviar HTTP POST a Evolution API para despachar el mensaje al celular
        
        return {"status": "success", "reply": reply}

    return {"status": "ignored"}
