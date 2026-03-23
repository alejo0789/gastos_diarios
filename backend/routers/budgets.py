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
