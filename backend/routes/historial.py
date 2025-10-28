from fastapi import APIRouter
from db.cassandra import session as cassandra_session
from utils.encoder import custom_jsonable_encoder
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/api/historial", tags=["historial"])

# Asegurarse de que la tabla existe
cassandra_session.execute("""
CREATE TABLE IF NOT EXISTS historial (
    id UUID PRIMARY KEY,
    usuario TEXT,
    fecha TIMESTAMP,
    tipo TEXT,
    descripcion TEXT
)
""")


# Guardar evento en Cassandra
def registrar_evento(usuario: str, tipo: str, descripcion: str):
    usuario = usuario.strip().lower()
    fecha = datetime.utcnow()

    query = """
        INSERT INTO historial (id, usuario, fecha, tipo, descripcion)
        VALUES (%s, %s, %s, %s, %s)
    """
    cassandra_session.execute(query, (uuid4(), usuario, fecha, tipo, descripcion))


# Endpoint para traer historial de un usuario
@router.get("/{usuario}")
def historial_usuario(usuario: str):
    usuario = usuario.strip().lower()
    query = """
        SELECT fecha, tipo, descripcion
        FROM historial
        WHERE usuario=%s
        ORDER BY fecha DESC
    """
    rows = cassandra_session.execute(query, [usuario])

    historial = [
        {
            "fecha": r.fecha.isoformat() if r.fecha else None,
            "tipo": r.tipo,
            "descripcion": r.descripcion
        }
        for r in rows
    ]

    return custom_jsonable_encoder({
        "usuario": usuario,
        "historial": historial
    })
