from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models
import crud

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserRegister(BaseModel):
    phone_number: str
    name: str
    password: str

class UserLogin(BaseModel):
    phone_number: str
    password: str

@router.post("/register")
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone_number == user.phone_number).first()
    if db_user:
        if db_user.password:
            raise HTTPException(status_code=400, detail="Este usuario ya está registrado.")
        else:
            db_user.name = user.name
            db_user.password = user.password
            db.commit()
            return {"user_id": db_user.id, "name": db_user.name, "phone_number": db_user.phone_number}

    new_user = crud.get_or_create_user(db, phone_number=user.phone_number, name=user.name)
    new_user.password = user.password
    db.commit()
    return {"user_id": new_user.id, "name": new_user.name, "phone_number": new_user.phone_number}

@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.phone_number == user.phone_number, models.User.password == user.password).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas o el usuario no existe.")
    
    return {"user_id": db_user.id, "name": db_user.name, "phone_number": db_user.phone_number}
