import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes

app = FastAPI(
    title="LeadBoostAI - Block 11: Enterprise Simulator",
    description="Mock ERP System (SAP/Oracle) with live dynamics for B6 validation.",
    version="1.0.0"
)

# Configuración CORS (Permitir que Dashboard/B6 conecten)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/enterprise", tags=["Enterprise ERP"])

if __name__ == "__main__":
    # Puerto 8011 para diferenciar de otros microservicios
    uvicorn.run("main:app", host="0.0.0.0", port=8011, reload=True)