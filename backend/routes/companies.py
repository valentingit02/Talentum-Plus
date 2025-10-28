from fastapi import APIRouter
from utils.encoder import custom_jsonable_encoder
from db.mongo import companies
from db.cassandra import session as cassandra_session

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.post("/")
def create_company(data: dict):
    nombre = data.get("nombre", "").strip().lower()
    if not nombre:
        return {"error": "El nombre de la empresa es obligatorio"}

    # Guardar en Mongo
    result = companies.insert_one({"nombre": nombre})
    created_company = companies.find_one({"_id": result.inserted_id})

    # Guardar en Cassandra
    cassandra_session.execute(
        """
        INSERT INTO companies (nombre)
        VALUES (%s)
        """,
        (nombre,)
    )

    return {"message": "Empresa creada", "data": custom_jsonable_encoder(created_company)}

@router.get("/{nombre}")
def get_company(nombre: str):
    empresa = companies.find_one({"nombre": nombre.strip().lower()})
    if not empresa:
        return {"error": "Empresa no encontrada en Mongo"}
    return custom_jsonable_encoder(empresa)

@router.get("/")
def get_all_companies():
    companies_list = list(companies.find())
    return custom_jsonable_encoder(companies_list)
