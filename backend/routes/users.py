from fastapi import APIRouter
from pydantic import BaseModel
from db.mongo import users
from db.neo4j import get_driver
from utils.encoder import custom_jsonable_encoder
from routes.historial import registrar_evento  # 👉 guardamos eventos en Cassandra

router = APIRouter(prefix="/api/users", tags=["users"])


class UserRequest(BaseModel):
    nombre: str
    email: str
    skills: list[str] = []
    estudios: str | None = None
    experiencia: str | None = None
    trabajoAnterior: str | None = None


class CapacitacionRequest(BaseModel):
    nombre: str
    capacitacion: str


# Crear usuario
@router.post("/")
def create_user(data: UserRequest):
    nombre = data.nombre.strip().lower()
    user_doc = {
        "nombre": nombre,
        "email": data.email,
        "skills": data.skills,
        "estudios": data.estudios,
        "experiencia": data.experiencia,
        "trabajoAnterior": data.trabajoAnterior,
        "capacitaciones": [],
        "aplicaciones": [], 
    }

    # Mongo
    users.insert_one(user_doc)

    # Neo4j
    driver = get_driver()
    with driver.session() as session:
        session.run("MERGE (u:Usuario {nombre:$nombre})", nombre=nombre)

        for skill in data.skills:
            session.run("""
                MERGE (u:Usuario {nombre:$nombre})
                MERGE (s:Skill {nombre:$skill})
                MERGE (u)-[:TIENE]->(s)
            """, nombre=nombre, skill=skill.strip().lower())

        if data.estudios:
            session.run("""
                MERGE (u:Usuario {nombre:$nombre})
                MERGE (e:Estudio {nombre:$estudio})
                MERGE (u)-[:ESTUDIO_REALIZADO]->(e)
            """, nombre=nombre, estudio=data.estudios.strip().lower())

        if data.experiencia:
            session.run("""
                MERGE (u:Usuario {nombre:$nombre})
                MERGE (exp:Experiencia {anios:$exp})
                MERGE (u)-[:TIENE_EXPERIENCIA]->(exp)
            """, nombre=nombre, exp=data.experiencia.strip())

        if data.trabajoAnterior:
            session.run("""
                MERGE (u:Usuario {nombre:$nombre})
                MERGE (t:Trabajo {nombre:$trabajo})
                MERGE (u)-[:TRABAJO_ANTERIOR]->(t)
            """, nombre=nombre, trabajo=data.trabajoAnterior.strip().lower())

    # Historial en Cassandra
    registrar_evento(nombre, "usuario", "Usuario creado")

    return {"message": "Usuario creado ✅", "data": custom_jsonable_encoder(user_doc)}


# Agregar capacitación a un usuario
@router.post("/capacitacion")
def add_capacitacion(req: CapacitacionRequest):
    nombre = req.nombre.strip().lower()
    cap = req.capacitacion.strip().lower()

    # Mongo
    users.update_one(
        {"nombre": nombre},
        {"$push": {"capacitaciones": cap}}
    )

    # Neo4j
    driver = get_driver()
    with driver.session() as session:
        session.run("""
            MERGE (u:Usuario {nombre:$nombre})
            MERGE (c:Capacitacion {nombre:$cap})
            MERGE (u)-[:REALIZO]->(c)
        """, nombre=nombre, cap=cap)

    # Historial en Cassandra
    registrar_evento(nombre, "capacitacion", f"Agregó capacitación {cap}")

    return {"message": f"Capacitación '{cap}' agregada a {nombre} ✅"}


# Obtener usuario (con aplicaciones incluidas)
@router.get("/{nombre}")
def get_user(nombre: str):
    nombre = nombre.strip().lower()
    user = users.find_one({"nombre": nombre})
    if not user:
        return {"error": "Usuario no encontrado"}
    return custom_jsonable_encoder(user)


# Eliminar usuario
@router.delete("/{nombre}")
def delete_user(nombre: str):
    nombre = nombre.strip().lower()
    users.delete_one({"nombre": nombre})

    driver = get_driver()
    with driver.session() as session:
        session.run("MATCH (u:Usuario {nombre:$n}) DETACH DELETE u", n=nombre)

    # Historial en Cassandra
    registrar_evento(nombre, "usuario", "Usuario eliminado")

    return {"message": f"Usuario {nombre} eliminado en todas las bases ✅"}
