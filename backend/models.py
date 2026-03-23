from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True) # Número de WhatsApp
    name = Column(String, nullable=True)
    
    tamagotchi = relationship("Tamagotchi", back_populates="owner", uselist=False)
    expenses = relationship("Expense", back_populates="user")
    budgets = relationship("Budget", back_populates="user")

class Tamagotchi(Base):
    __tablename__ = "tamagotchis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, default="Billeterín")
    species = Column(String, default="piggy")  # Para seleccionar diferentes mascotas en un futuro (ej. piggy, dragon, alien)
    health = Column(Integer, default=100) # 0-100 (Baja si se excede presupuesto)
    happiness = Column(Integer, default=100) # 0-100
    xp = Column(Integer, default=0)
    stage = Column(String, default="baby") # Etapas: baby, teen, adult

    owner = relationship("User", back_populates="tamagotchi")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    category = Column(String)
    description = Column(String, nullable=True) # Ejemplo: Lo extraído por la IA de n8n
    shared_goal_id = Column(Integer, ForeignKey("shared_goals.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="expenses")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String) # "General" o categorías específicas
    limit_amount = Column(Float)
    month = Column(Integer, default=datetime.utcnow().month)
    year = Column(Integer, default=datetime.utcnow().year)

    user = relationship("User", back_populates="budgets")

class SharedGoal(Base):
    __tablename__ = "shared_goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Ej: "Viaje Grupal Cancún"
    target_amount = Column(Float)
    
class SharedGoalParticipant(Base):
    __tablename__ = "shared_goal_participants"

    id = Column(Integer, primary_key=True, index=True)
    shared_goal_id = Column(Integer, ForeignKey("shared_goals.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
