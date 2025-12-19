from fastapi import FastAPI
from api.routes import router

app = FastAPI(title="Microservice Visual - FASE 7")

# Registrar rutas
app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "Microservice Visual Engine", "version": "0.1.0"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
