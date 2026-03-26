from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from datetime import datetime

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

class BudgetCreate(BaseModel):
    user_id: int
    limit_amount: float
    category: str = "General"

@router.post("/")
def create_monthly_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    
    existing = db.query(models.Budget).filter(
        models.Budget.user_id == budget.user_id,
        models.Budget.month == current_month,
        models.Budget.year == current_year,
        models.Budget.category == budget.category
    ).first()
    
    if existing:
        existing.limit_amount = budget.limit_amount
        db.commit()
        db.refresh(existing)
        return existing
        
    new_budget = models.Budget(
        user_id=budget.user_id,
        limit_amount=budget.limit_amount,
        category=budget.category,
        month=current_month,
        year=current_year
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget

class SharedGoalCreate(BaseModel):
    name: str
    target_amount: float
    creator_user_id: int

@router.post("/shared")
def create_shared_goal(goal: SharedGoalCreate, db: Session = Depends(get_db)):
    new_goal = models.SharedGoal(name=goal.name, target_amount=goal.target_amount)
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    # Añadir al creador como participante
    participant = models.SharedGoalParticipant(shared_goal_id=new_goal.id, user_id=goal.creator_user_id)
    db.add(participant)
    db.commit()
    
    return {"goal": new_goal, "message": "Meta grupal creada"}

from sqlalchemy import func
import crud

@router.get("/shared/{user_id}")
def get_user_shared_goals(user_id: int, db: Session = Depends(get_db)):
    # 1. Obtener todas las metas a las que pertenece el usuario
    participant_links = db.query(models.SharedGoalParticipant).filter(models.SharedGoalParticipant.user_id == user_id).all()
    goal_ids = [p.shared_goal_id for p in participant_links]
    
    goals = db.query(models.SharedGoal).filter(models.SharedGoal.id.in_(goal_ids)).all()
    
    result = []
    for g in goals:
        # Sumar aportes totales a esta meta
        total_saved = db.query(func.sum(models.Expense.amount)).filter(models.Expense.shared_goal_id == g.id).scalar() or 0.0
        
        # Obtener desglose de aportes por cada participante distinto
        expenses_by_user = db.query(
            models.Expense.user_id,
            func.sum(models.Expense.amount).label("total")
        ).filter(models.Expense.shared_goal_id == g.id).group_by(models.Expense.user_id).all()
        
        participants_data = []
        for eu in expenses_by_user:
            u = db.query(models.User).filter(models.User.id == eu.user_id).first()
            if u:
                participants_data.append({
                    "id": u.id,
                    "name": u.name or u.phone_number, 
                    "contributed": eu.total
                })
                
        # Asegurarnos de listar también a los participantes que no han aportado nada
        for p_link in db.query(models.SharedGoalParticipant).filter(models.SharedGoalParticipant.shared_goal_id == g.id).all():
            if not any(pd["id"] == p_link.user_id for pd in participants_data):
                u_empty = db.query(models.User).filter(models.User.id == p_link.user_id).first()
                if u_empty:
                    participants_data.append({"id": u_empty.id, "name": u_empty.name or u_empty.phone_number, "contributed": 0.0})
        
        result.append({
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "saved_amount": total_saved,
            "participants": participants_data
        })
        
    return result

class ParticipantCreate(BaseModel):
    identifier: str # Puede ser nombre o teléfono

@router.post("/shared/{goal_id}/participants")
def add_participant(goal_id: int, p: ParticipantCreate, db: Session = Depends(get_db)):
    goal = db.query(models.SharedGoal).filter(models.SharedGoal.id == goal_id).first()
    if not goal: raise HTTPException(status_code=404, detail="Meta/Viaje no encontrado")
    
    # Buscar usuario
    user = db.query(models.User).filter(
        (models.User.phone_number == p.identifier) | (models.User.name == p.identifier)
    ).first()
    
    if not user:
        # Si introdujo un celular, crear su perfil pasivo automáticamente
        if any(char.isdigit() for char in p.identifier):
            user = crud.get_or_create_user(db, phone_number=p.identifier)
        else:
            raise HTTPException(status_code=404, detail="Participante no encontrado. Ingresa un número de teléfono válido.")
            
    # Evitar duplicados
    existing = db.query(models.SharedGoalParticipant).filter(
        models.SharedGoalParticipant.shared_goal_id == goal.id,
        models.SharedGoalParticipant.user_id == user.id
    ).first()
    
    if not existing:
        new_participant = models.SharedGoalParticipant(shared_goal_id=goal.id, user_id=user.id)
        db.add(new_participant)
        db.commit()
    
    return {"status": "success", "message": "Participante agregado exitosamente", "user": {"id": user.id, "name": user.name or user.phone_number}}

@router.put("/shared/{goal_id}")
def update_shared_goal(goal_id: int, goal: SharedGoalCreate, db: Session = Depends(get_db)):
    db_goal = db.query(models.SharedGoal).filter(models.SharedGoal.id == goal_id).first()
    if not db_goal: raise HTTPException(status_code=404)
    db_goal.name = goal.name
    db_goal.target_amount = goal.target_amount
    db.commit()
    return {"message": "Meta actualizada"}

@router.delete("/shared/{goal_id}")
def delete_shared_goal(goal_id: int, db: Session = Depends(get_db)):
    db_goal = db.query(models.SharedGoal).filter(models.SharedGoal.id == goal_id).first()
    if not db_goal: raise HTTPException(status_code=404)
    
    # Desenlazar el progreso financiero (gastos) para no romper el historial del usuario
    db.query(models.Expense).filter(models.Expense.shared_goal_id == goal_id).update({"shared_goal_id": None})
    
    # Borrar la lista de participantes asociada al viaje
    for p in db.query(models.SharedGoalParticipant).filter(models.SharedGoalParticipant.shared_goal_id == goal_id).all():
        db.delete(p)
        
    # Borrar la meta definitiva
    db.delete(db_goal)
    db.commit()
    return {"message": "Meta eliminada"}

@router.delete("/shared/{goal_id}/participants/{user_id}")
def remove_participant(goal_id: int, user_id: int, db: Session = Depends(get_db)):
    p = db.query(models.SharedGoalParticipant).filter(
        models.SharedGoalParticipant.shared_goal_id == goal_id,
        models.SharedGoalParticipant.user_id == user_id
    ).first()
    if p:
        db.delete(p)
        db.commit()
    return {"message": "Participante eliminado"}

class FixedExpenseCreate(BaseModel):
    user_id: int
    name: str
    amount: float
    day_of_month: int = 1

@router.get("/fixed-expenses/{user_id}")
def get_fixed_expenses(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.FixedExpense).filter(models.FixedExpense.user_id == user_id).all()

@router.post("/fixed-expenses")
def create_fixed_expense(expense: FixedExpenseCreate, db: Session = Depends(get_db)):
    db_exp = models.FixedExpense(**expense.dict())
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp

@router.delete("/fixed-expenses/{expense_id}")
def delete_fixed_expense(expense_id: int, db: Session = Depends(get_db)):
    db_exp = db.query(models.FixedExpense).filter(models.FixedExpense.id == expense_id).first()
    if db_exp:
        db.delete(db_exp)
        db.commit()
    return {"message": "Gasto fijo eliminado"}

@router.get("/summary/{user_id}")
def get_user_summary(user_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    total_income = db.query(func.sum(models.Income.amount)).filter(models.Income.user_id == user_id).scalar() or 0.0
    total_expenses_var = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == user_id, 
        models.Expense.shared_goal_id == None,
        ~models.Expense.category.ilike('%ahorro%')
    ).scalar() or 0.0
    total_fixed = db.query(func.sum(models.FixedExpense.amount)).filter(models.FixedExpense.user_id == user_id).scalar() or 0.0
    total_expenses = total_expenses_var + total_fixed
    total_savings = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == user_id, 
        (models.Expense.shared_goal_id != None) | models.Expense.category.ilike('%ahorro%')
    ).scalar() or 0.0
    
    budget = db.query(models.Budget).filter(models.Budget.user_id == user_id, models.Budget.category == "General").order_by(models.Budget.id.desc()).first()
    budget_limit = budget.limit_amount if budget else 1000000.0

    return {"income": total_income, "expenses": total_expenses, "savings": total_savings, "budget_limit": budget_limit}

class BudgetLimitUpdate(BaseModel):
    limit: float

@router.put("/limit/{user_id}")
def update_budget_limit(user_id: int, data: BudgetLimitUpdate, db: Session = Depends(get_db)):
    budget = db.query(models.Budget).filter(models.Budget.user_id == user_id, models.Budget.category == "General").first()
    from datetime import datetime
    if budget:
        budget.limit_amount = data.limit
    else:
        budget = models.Budget(user_id=user_id, category="General", limit_amount=data.limit, month=datetime.utcnow().month, year=datetime.utcnow().year)
        db.add(budget)
    db.commit()
    return {"message": "Success"}
