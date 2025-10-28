from fastapi import APIRouter
from pydantic import BaseModel
from db.neo4j import get_driver
from db.mongo import users
from datetime import datetime

router = APIRouter(prefix="/api/skills", tags=["skills"])

# Modelo de request para segmentación
class SkillsRequest(BaseModel):
    skills: list[str]

# Agregar skill
@router.post("/add")
def add_skill(user_name: str, skill: str):
    driver = get_driver()
    user = user_name.strip().lower()
    skill = skill.strip().lower()

    # Guardar en Neo4j
    with driver.session() as session:
        session.run("""
            MERGE (u:Usuario {nombre:$user})
            MERGE (s:Skill {nombre:$skill})
            MERGE (u)-[:TIENE]->(s)
        """, user=user, skill=skill)

    # Guardar en Mongo + historial
    existing = users.find_one({"nombre": user})
    historial_entry = f"Agregó skill {skill} - {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    if existing:
        users.update_one(
            {"nombre": user},
            {
                "$addToSet": {"skills": skill},
                "$push": {"historial": historial_entry}
            }
        )
    else:
        users.insert_one({
            "nombre": user,
            "skills": [skill],
            "historial": [historial_entry]
        })

    return {"message": f"Skill '{skill}' agregado a {user} en MongoDB y Neo4j"}

# Segmentar usuarios por skills
@router.post("/segment")
def segment_by_skills(request: SkillsRequest):
    driver = get_driver()
    with driver.session() as session:
        result = session.run("""
            MATCH (u:Usuario)-[:TIENE]->(s:Skill)
            WHERE ANY(skill IN $skills WHERE toLower(s.nombre) = toLower(skill))
            RETURN u.nombre AS nombre, collect(toLower(s.nombre)) AS skills
        """, skills=[s.strip().lower() for s in request.skills])

        usuarios = [
            {"nombre": record["nombre"], "skills": record["skills"]}
            for record in result
        ]

    return {"usuarios": usuarios}
