from bson import ObjectId

def custom_jsonable_encoder(obj):
    """
    Convierte ObjectId a string dentro de dicts o listas
    para que FastAPI pueda serializar la respuesta JSON.
    """
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, list):
        return [custom_jsonable_encoder(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: custom_jsonable_encoder(value) for key, value in obj.items()}
    return obj
