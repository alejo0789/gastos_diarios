import sys
import subprocess
import os

def main():
    # Ruta base del proyecto (donde está este run.py)
    base_path = os.path.dirname(os.path.abspath(__file__))
    backend_path = os.path.join(base_path, "backend")
    
    # Ruta del intérprete de Python dentro del venv (Windows)
    venv_python = os.path.join(backend_path, "venv", "Scripts", "python.exe")
    
    if not os.path.exists(venv_python):
        print(f"❌ ERROR: No se encontró el entorno virtual en: {venv_python}")
        print("💡 Sugerencia: Crea el venv ejecutando 'python -m venv venv' dentro de la carpeta 'backend'.")
        sys.exit(1)

    print("\n" + "="*50)
    print("🚀 Iniciando Servidor Backend (FastAPI)")
    print("📍 Ubicación: http://localhost:8000")
    print("="*50 + "\n")
    
    # Cambiamos el directorio de trabajo a la carpeta 'backend'
    os.chdir(backend_path)
    
    # Comando para iniciar Uvicorn
    # -m uvicorn permite ejecutar uvicorn como módulo del python del venv
    # help: uvicorn main:app --reload --host 0.0.0.0 --port 8000
    cmd = [
        venv_python, 
        "-m", "uvicorn", 
        "main:app", 
        "--reload", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ]
    
    try:
        # Ejecutamos el servidor
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido por el usuario.")
    except Exception as e:
        print(f"\n❌ Se produjo un error al iniciar el servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
