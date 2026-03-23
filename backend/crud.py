from sqlalchemy.orm import Session
import models

def get_or_create_user(db: Session, phone_number: str, name: str = None):
    db_user = db.query(models.User).filter(models.User.phone_number == phone_number).first()
    if db_user:
        return db_user
    
    # Crear usuario si no existe
    new_user = models.User(phone_number=phone_number, name=name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Asignar un Tamagotchi inicial
    new_tamagotchi = models.Tamagotchi(user_id=new_user.id)
    db.add(new_tamagotchi)
    db.commit()
    
    return new_user

def create_expense(db: Session, user_id: int, amount: float, category: str, description: str = None):
    db_expense = models.Expense(user_id=user_id, amount=amount, category=category, description=description)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

from datetime import datetime
from sqlalchemy import func

def update_tamagotchi_health(db: Session, tamagotchi_id: int, user_id: int, expense_amount: float, expense_category: str):
    t = db.query(models.Tamagotchi).filter(models.Tamagotchi.id == tamagotchi_id).first()
    if not t: return None
    
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    
    # 1. Obtener límite de presupuesto del usuario para este mes (General)
    budget = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.month == current_month,
        models.Budget.year == current_year,
        models.Budget.category == "General" # Para el MVP simplificamos a General
    ).first()
    
    # 2. Sumar todos los gastos de este mes del usuario
    total_spent_query = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == user_id,
        func.extract('month', models.Expense.date) == current_month,
        func.extract('year', models.Expense.date) == current_year
    ).scalar()
    
    total_spent = total_spent_query or 0.0
    
    # 3. Matemática de Daño / Recompensa (Algoritmo Tamagotchi)
    damage = 0
    if budget and budget.limit_amount > 0:
        if total_spent > budget.limit_amount:
            # Castigo por excederse: daño base + escalar por el exceso
            over_budget = total_spent - budget.limit_amount
            damage = int(5 + (over_budget * 0.05)) # Ajustable!
            t.happiness = max(0, t.happiness - 10)
        else:
            # Recompensa por reportar respetando el límite
            t.xp += 25
            t.happiness = min(100, t.happiness + 5)
    else:
        # Modo libre (Sin presupuesto establecido aún)
        t.xp += 10
        damage = int(expense_amount / 2000) # Leve desgaste por gastar mucho de golpe sin tener un límite
        
    t.health = max(0, t.health - damage)
    
    # 4. Evolución MVP
    if t.xp >= 500 and t.stage == "baby":
        t.stage = "teen"
        t.health = 100 # Curación total al evolucionar
    elif t.xp >= 2000 and t.stage == "teen":
        t.stage = "adult"
        t.health = 100
        
    db.commit()
    db.refresh(t)
    return t
