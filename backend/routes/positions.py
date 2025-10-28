from fastapi import APIRouter
from utils.encoder import custom_jsonable_encoder
from db.mongo import positions, users
from db.cassandra import session as cassandra_session
from db.neo4j import get_driver

router = APIRouter(prefix="/api/positions", tags=["positions"])

# Función para parsear experiencia (string → número mínimo)
def parse_experiencia(valor: str) -> int:
    if not valor:
        return 0
    valor = str(valor).strip()
    if "+" in valor:  # Ej: "6+"
        return int(valor.replace("+", ""))
    if "-" in valor:  # Ej: "4-5"
        return int(valor.split("-")[0])
    return int(valor)  # Ej: "2"

# Crear posición en Mongo + Cassandra + Neo4j
@router.post("/")
def create_position(data: dict):
    data["titulo"] = data["titulo"].strip().lower()
    data["empresa"] = data["empresa"].strip().lower()
    data["aplicantes"] = []

    # Parseamos experiencia
    exp_val = parse_experiencia(data.get("experiencia_requerida", "0"))

    # Mongo
    result = positions.insert_one(data)
    created = positions.find_one({"_id": result.inserted_id})

    # Cassandra (guardar experiencia como int mínimo)
    query = """
    INSERT INTO posiciones (empresa, puesto, experiencia, estudios)
    VALUES (%s, %s, %s, %s)
    """
    cassandra_session.execute(query, (
        data["empresa"],
        data["titulo"],
        exp_val,
        data.get("estudios_requeridos", "")
    ))

    # Neo4j
    driver = get_driver()
    with driver.session() as session:
        session.run("""
            MERGE (e:Empresa {nombre:$empresa})
            MERGE (p:Posicion {titulo:$titulo})
            MERGE (e)-[:TIENE_POSICION]->(p)
        """, empresa=data["empresa"], titulo=data["titulo"])

        # Estudios requeridos
        if data.get("estudios_requeridos"):
            session.run("""
                MATCH (p:Posicion {titulo:$titulo})
                MERGE (est:Estudio {nombre:$est})
                MERGE (p)-[:REQUERIMIENTO_ESTUDIO]->(est)
            """, titulo=data["titulo"], est=data["estudios_requeridos"].strip().lower())

        # Experiencia requerida
        if exp_val > 0:
            session.run("""
                MATCH (p:Posicion {titulo:$titulo})
                MERGE (exp:Experiencia {anios:$exp})
                MERGE (p)-[:REQUERIMIENTO_EXPERIENCIA]->(exp)
            """, titulo=data["titulo"], exp=str(exp_val))

        # Skills requeridos
        for skill in data.get("skills_requeridos", []):
            session.run("""
                MATCH (p:Posicion {titulo:$titulo})
                MERGE (s:Skill {nombre:$skill})
                MERGE (p)-[:REQUERIMIENTO_SKILL]->(s)
            """, titulo=data["titulo"], skill=skill.strip().lower())

    return {"message": "Posición creada ✅", "data": custom_jsonable_encoder(created)}


# Aplicar a una posición
@router.post("/{titulo}/apply/{usuario}")
def apply_position(titulo: str, usuario: str):
    titulo = titulo.strip().lower()
    usuario = usuario.strip().lower()

    # Mongo
    positions.update_one({"titulo": titulo}, {"$push": {"aplicantes": usuario}})
    users.update_one({"nombre": usuario}, {"$push": {"historial": f"Aplicó a {titulo}"}})

    # Neo4j
    driver = get_driver()
    with driver.session() as session:
        session.run("""
            MATCH (u:Usuario {nombre:$usuario})
            MERGE (p:Posicion {titulo:$titulo})
            MERGE (u)-[:APLICO_A]->(p)
        """, usuario=usuario, titulo=titulo)

    return {"message": f"{usuario} aplicado a {titulo} ✅"}


# Todas las posiciones (Mongo)
@router.get("/")
def get_positions():
    return custom_jsonable_encoder(list(positions.find()))


# Posiciones por empresa (Cassandra)
@router.get("/empresa/{empresa}")
def get_positions_by_empresa(empresa: str):
    empresa = empresa.strip().lower()
    query = "SELECT empresa, puesto, experiencia, estudios FROM posiciones WHERE empresa = %s"
    rows = cassandra_session.execute(query, (empresa,))
    
    posiciones = [
        {
            "empresa": row.empresa,
            "puesto": row.puesto,
            "experiencia": row.experiencia,
            "estudios": row.estudios
        }
        for row in rows
    ]
    return {"empresa": empresa, "posiciones": posiciones}
