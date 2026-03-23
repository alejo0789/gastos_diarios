from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import whatsapp, budgets, auth

# Crear tablas automáticamente al arrancar
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finanzas Tamagotchi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registrar routers
app.include_router(whatsapp.router)
app.include_router(budgets.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend FastAPI Funcionando para Tamagotchi Financiero"}

