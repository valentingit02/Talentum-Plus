from fastapi import APIRouter
from db.mongo import users, inscripciones
from utils.encoder import custom_jsonable_encoder
from datetime import datetime

router = APIRouter(prefix="/api/capacitaciones", tags=["capacitaciones"])

# Inscribir usuario a una capacitación
@router.post("/inscribir/{usuario}/{capacitacion}")
def inscribir_usuario(usuario: str, capacitacion: str):
    usuario = usuario.strip().lower()
    capacitacion = capacitacion.strip().lower()

    # Registro en inscripciones
    inscripcion = {
        "usuario": usuario,
        "capacitacion": capacitacion,
        "progreso": 0,  # % inicial
        "fecha": datetime.utcnow().isoformat()
    }
    inscripciones.insert_one(inscripcion)

    # Guardar en historial del usuario
    users.update_one(
        {"nombre": usuario},
        {"$push": {"historial": f"Se inscribió en capacitación: {capacitacion} ({datetime.utcnow().isoformat()})"}}
    )

    return {"message": f"{usuario} inscripto a {capacitacion} ✅"}


# Ver inscripciones de un curso
@router.get("/curso/{capacitacion}")
def ver_inscripciones(capacitacion: str):
    capacitacion = capacitacion.strip().lower()
    inscriptos = list(inscripciones.find({"capacitacion": capacitacion}))
    return custom_jsonable_encoder({
        "capacitacion": capacitacion,
        "inscriptos": inscriptos
    })


# Ver inscripciones de un usuario
@router.get("/usuario/{usuario}")
def ver_capacitaciones_usuario(usuario: str):
    usuario = usuario.strip().lower()
    cursos = list(inscripciones.find({"usuario": usuario}))
    return custom_jsonable_encoder({
        "usuario": usuario,
        "capacitaciones": cursos
    })
