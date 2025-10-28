from fastapi import APIRouter
from db.mongo import users, positions, procesos
from utils.encoder import custom_jsonable_encoder
from datetime import datetime
from routes.historial import registrar_evento  # 👉 historial centralizado en Cassandra

router = APIRouter(prefix="/api/seleccion", tags=["seleccion"])


# Aplicar a una posición (JSON body)
@router.post("/aplicar")
def aplicar_posicion(data: dict):
    usuario = data.get("usuario", "").strip().lower()
    posicion = data.get("posicion", "").strip().lower()
    empresa = data.get("empresa", "").strip().lower()

    pos = positions.find_one({"titulo": posicion, "empresa": empresa})
    user = users.find_one({"nombre": usuario})

    if not pos or not user:
        return {"error": "Usuario o posición no encontrada"}

    # Normalizar skills (pueden venir como string o dict)
    user_skills = []
    for s in user.get("skills", []):
        if isinstance(s, str):
            user_skills.append(s.lower())
        elif isinstance(s, dict) and "nombre" in s:
            user_skills.append(s["nombre"].lower())

    pos_skills = [s.lower() for s in pos.get("skills_requeridos", [])]
    coincidencias = sum(1 for s in user_skills if s in pos_skills)

    # Normalizar capacitaciones
    user_caps = []
    for c in user.get("capacitaciones", []):
        if isinstance(c, str):
            user_caps.append(c.lower())
        elif isinstance(c, dict) and "nombre" in c:
            user_caps.append(c["nombre"].lower())

    estudios_match = pos.get("estudios_requeridos", "").lower() in user_caps

    # Experiencia
    try:
        exp_match = int(user.get("experiencia", "0")) >= int(
            str(pos.get("experiencia_requerida", "0"))
            .replace("+", "")
            .split("-")[0]
        )
    except ValueError:
        exp_match = False

    condiciones = [coincidencias >= 1, estudios_match, exp_match]
    cumple = sum(1 for c in condiciones if c) >= 2

    if not cumple:
        return {"message": f"{usuario} no cumple con los requisitos mínimos ❌"}

    proceso = {
        "usuario": usuario,
        "posicion": posicion,
        "empresa": empresa,
        "estado": "Preselección",
        "feedback": "No se agregó feedback aún.",
        "coincidencias": coincidencias,
        "entrevistas": [],
        "fecha": datetime.utcnow().isoformat(),
    }

    # Guardar en colección de procesos
    procesos.insert_one(proceso)

    # Guardar también dentro del usuario en Mongo
    users.update_one(
        {"nombre": usuario},
        {"$push": {"aplicaciones": proceso}}
    )

    # Historial en Cassandra
    registrar_evento(usuario, "aplicacion", f"Aplicó a {posicion} en {empresa}")

    return {
        "message": f"{usuario} aplicado a {posicion} en {empresa} ✅",
        "estado": "Preselección",
    }


# Agregar entrevista
@router.post("/entrevista/{usuario}/{posicion}")
def agregar_entrevista(usuario: str, posicion: str, data: dict):
    usuario = usuario.strip().lower()
    posicion = posicion.strip().lower()
    descripcion = data.get("descripcion", "")
    estado = data.get("estado", "Pendiente")

    procesos.update_one(
        {"usuario": usuario, "posicion": posicion},
        {"$push": {"entrevistas": {"descripcion": descripcion, "estado": estado}}},
    )

    # Historial en Cassandra
    registrar_evento(
        usuario, "entrevista", f"Entrevista para {posicion}: {descripcion} ({estado})"
    )

    return {"message": f"Entrevista agregada a {usuario} para {posicion} ✅"}


# Ver procesos por usuario
@router.get("/usuario/{usuario}")
def procesos_usuario(usuario: str):
    usuario = usuario.strip().lower()
    lista = list(procesos.find({"usuario": usuario}))
    return custom_jsonable_encoder({"usuario": usuario, "procesos": lista})


# Ver procesos por posición
@router.get("/posicion/{posicion}")
def procesos_posicion(posicion: str):
    posicion = posicion.strip().lower()
    lista = list(procesos.find({"posicion": posicion}))
    return custom_jsonable_encoder({"posicion": posicion, "procesos": lista})
