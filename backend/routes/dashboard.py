from fastapi import APIRouter, HTTPException
from db.mongo import users, positions, companies, inscripciones, procesos
from db.neo4j import get_driver
from utils.encoder import custom_jsonable_encoder
from datetime import datetime

# Prefijo corregido: ahora todos los endpoints empiezan en /api
router = APIRouter(prefix="/api", tags=["dashboard"])

# Parse experiencia mínima
def parse_experiencia(valor: str) -> int:
    if not valor:
        return 0
    valor = str(valor).strip()
    if "+" in valor:
        return int(valor.replace("+", ""))
    if "-" in valor:
        return int(valor.split("-")[0])
    return int(valor)

# Normalizar skills (puede ser str o dict)
def normalize_skills(skill_list):
    if not skill_list:
        return []
    return list({(s.strip().lower() if isinstance(s, str) else s.get("nombre", "").strip().lower())
                 for s in skill_list if s})

# Perfil de usuario
@router.get("/dashboard/user/{nombre}")
def get_user_profile(nombre: str):
    nombre = nombre.strip().lower()
    user = users.find_one({"nombre": nombre})
    if not user:
        return {"error": "Usuario no encontrado"}

    user_skills = normalize_skills(user.get("skills", []))
    capacitaciones = [c.strip().lower() for c in user.get("capacitaciones", [])]

    driver = get_driver()
    with driver.session() as session:
        skills = session.run(
            "MATCH (u:Usuario {nombre:$n})-[:TIENE]->(s:Skill) RETURN toLower(s.nombre) AS skill",
            n=nombre
        )
        skills = [r["skill"] for r in skills]

        sugerencias = session.run("""
            MATCH (p:Posicion)-[:REQUERIMIENTO_SKILL]->(s:Skill)
            WHERE NOT toLower(s.nombre) IN $skills
            RETURN DISTINCT toLower(s.nombre) AS recomendado
        """, skills=user_skills + skills)
        sugerencias = [r["recomendado"] for r in sugerencias]

    return custom_jsonable_encoder({
        "usuario": nombre,
        "skills": list(set(user_skills + skills)),
        "capacitaciones": capacitaciones,
        "sugerencias_capacitacion": sugerencias,
        "experiencia": user.get("experiencia", "0"),
        "historial": user.get("historial", [])
    })

# Posiciones recomendadas
@router.get("/dashboard/user/{nombre}/positions")
def match_positions(nombre: str):
    nombre = nombre.strip().lower()
    user = users.find_one({"nombre": nombre})
    if not user:
        return {"error": "Usuario no encontrado"}

    user_skills = normalize_skills(user.get("skills", []))
    capacitaciones = [c.strip().lower() for c in user.get("capacitaciones", [])]
    user_exp = parse_experiencia(user.get("experiencia", "0"))

    driver = get_driver()
    with driver.session() as session:
        skills = session.run(
            "MATCH (u:Usuario {nombre:$n})-[:TIENE]->(s:Skill) RETURN toLower(s.nombre) AS skill",
            n=nombre
        )
        skills = [r["skill"] for r in skills]

    all_skills = list(set(user_skills + skills))
    matched, sugerencias_extra = [], []

    for pos in positions.find({}):
        pos_skills = [s.strip().lower() for s in pos.get("skills_requeridos", [])]
        pos_exp = parse_experiencia(pos.get("experiencia_requerida", "0"))

        coincidencias = sum(1 for s in all_skills if s in pos_skills)
        estudios_match = pos.get("estudios_requeridos", "").strip().lower() in capacitaciones
        exp_match = user_exp >= pos_exp

        faltantes = [s for s in pos_skills if s not in all_skills]
        if faltantes:
            with driver.session() as session:
                for skill in faltantes:
                    try:
                        caps = session.run("""
                            MATCH (c:Capacitacion)-[:ENSENIA]->(s:Skill {nombre:$skill})
                            RETURN c.nombre AS cap
                        """, skill=skill)
                        sugerencias_extra.extend([r["cap"] for r in caps])
                    except Exception:
                        pass

        if coincidencias > 0 or estudios_match or exp_match:
            matched.append({
                "titulo": pos.get("titulo", ""),
                "empresa": pos.get("empresa", ""),
                "skills_requeridos": pos_skills,
                "estudios_requeridos": pos.get("estudios_requeridos", ""),
                "experiencia_requerida": pos.get("experiencia_requerida", ""),
                "coincidencias": coincidencias,
                "exp_match": exp_match,
                "faltantes": faltantes
            })

    return custom_jsonable_encoder({
        "usuario": nombre,
        "posiciones_recomendadas": sorted(
            matched, key=lambda x: (x["coincidencias"], x["exp_match"]), reverse=True
        ),
        "capacitaciones_sugeridas": list(set(sugerencias_extra))
    })

# Empresa (Mongo)
@router.get("/positions/empresa/{nombre}")
def positions_by_company(nombre: str):
    nombre = nombre.strip().lower()
    company = companies.find_one({"nombre": nombre})
    if not company:
        return {"error": "Empresa no encontrada"}
    return custom_jsonable_encoder({
        "empresa": nombre,
        "posiciones": company.get("posiciones", [])
    })

# Inscripciones
@router.get("/capacitaciones/{nombre}/inscriptos")
def inscriptos(nombre: str):
    nombre = nombre.strip().lower()
    data = list(inscripciones.find({"capacitacion": nombre}))
    return custom_jsonable_encoder(data)

# Procesos por usuario
@router.get("/seleccion/usuario/{usuario}")
def procesos_usuario(usuario: str):
    usuario = usuario.strip().lower()
    data = list(procesos.find({"usuario": usuario}))
    return {"procesos": custom_jsonable_encoder(data)}

# Procesos por posición (para ver quién aplicó)
@router.get("/seleccion/posicion/{posicion}")
def procesos_por_posicion(posicion: str):
    data = list(procesos.find({"posicion": posicion}))
    return {"procesos": custom_jsonable_encoder(data)}

# Aplicar a posición
@router.post("/seleccion/aplicar")
def aplicar(data: dict):
    usuario = data.get("usuario", "").strip().lower()
    posicion = data.get("posicion", "").strip()
    empresa = data.get("empresa", "").strip()

    if not usuario or not posicion or not empresa:
        raise HTTPException(status_code=400, detail="Datos incompletos")

    # evitar duplicados
    existente = procesos.find_one({"usuario": usuario, "posicion": posicion, "empresa": empresa})
    if existente:
        return {"message": "Ya existe una aplicación previa"}

    nuevo = {
        "usuario": usuario,
        "posicion": posicion,
        "empresa": empresa,
        "estado": "aplicado",
        "fecha": datetime.utcnow()
    }
    procesos.insert_one(nuevo)
    return {"message": "Aplicación registrada ✅", "proceso": custom_jsonable_encoder(nuevo)}

# Alias para compatibilidad


@router.get("/dashboard/seleccion/usuario/{usuario}")
def procesos_usuario_alias(usuario: str):
    return procesos_usuario(usuario)

@router.get("/dashboard/seleccion/posicion/{posicion}")
def procesos_por_posicion_alias(posicion: str):
    return procesos_por_posicion(posicion)

@router.post("/dashboard/seleccion/aplicar")
def aplicar_alias(data: dict):
    return aplicar(data)
