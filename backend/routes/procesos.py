from fastapi import APIRouter
from db.mongo import procesos
from datetime import datetime

router = APIRouter(prefix="/api/seleccion", tags=["procesos"])

# Aplicar a una posición
@router.post("/aplicar")
def aplicar(data: dict):
    usuario = data.get("usuario", "").strip().lower()
    posicion = data.get("posicion", "")
    empresa = data.get("empresa", "")

    if not usuario or not posicion or not empresa:
        return {"error": "Faltan datos para aplicar"}

    procesos.insert_one({
        "usuario": usuario,
        "posicion": posicion,
        "empresa": empresa,
        "estado": "preseleccion",
        "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

    return {"message": f"{usuario} aplicado a {posicion} ({empresa}) con estado preselección"}
