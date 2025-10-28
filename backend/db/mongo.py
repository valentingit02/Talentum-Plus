from pymongo import MongoClient
from bson import ObjectId

#Conexión a MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["talentum_plus"]

#Acceso a las colecciones principales
users = db["users"]
companies = db["companies"]
positions = db["positions"]

#Colecciones adicionales necesarias
inscripciones = db["inscripciones"]   # Registro de inscripciones a capacitaciones
procesos = db["procesos"]             # Procesos de selección
catalogo = db["catalogo"]

#Colección para cursos
cursos = db["cursos"]


# Función para obtener la base de datos
def get_db():
    return db

# Utilidad: convertir ObjectId a string
def convert_objectid_to_str(data):
    if isinstance(data, list):
        for item in data:
            convert_objectid_to_str(item)
    elif isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, ObjectId):
                data[key] = str(value)
            elif isinstance(value, (dict, list)):
                convert_objectid_to_str(value)
    return data
