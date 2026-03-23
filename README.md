# Tamagotchi Financiero 🐷💸

Una aplicación web moderna con Backend orientada a gamificar el registro de gastos diarios mediante una "mascota" que reacciona a los objetivos y límites del presupuesto de forma interactiva.

## Arquitectura

- **Frontend:** React, Vite, Zustand, Tailwind/CSS Puro, y animaciones de UI Mobile-First (Glassmorphism).
- **Backend:** Python FastAPI, SQLAlchemy (PostgreSQL / SQLite).
- **Automatización & IA:** API en contacto con flujos NLP (n8n u otros) para permitir ingresos mediante lenguaje natural (vía WhatsApp).

## Configuración y Arranque

1. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate # (o .\venv\Scripts\activate en Windows)
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
