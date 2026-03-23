from fastapi import FastAPI
from database import engine, Base
import models
from routers import whatsapp, budgets

# Crear tablas automáticamente al arrancar
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finanzas Tamagotchi API", description="API para el control de gastos vía Webhook y gamificación")

# Registrar routers
app.include_router(whatsapp.router)
app.include_router(budgets.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend FastAPI Funcionando para Tamagotchi Financiero"}

