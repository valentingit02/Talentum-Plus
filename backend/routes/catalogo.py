from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.mongo import cursos  # 👉 usamos la colección "cursos"
from utils.encoder import custom_jsonable_encoder
from bson import ObjectId

router = APIRouter(prefix="/api/catalogo", tags=["catalogo"])

# Schema de entrada
class CursoRequest(BaseModel):
    titulo: str
    descripcion: str | None = None
    pdf_url: str | None = None
    clases: list[str] = []

# Crear un curso
@router.post("/")
def crear_curso(curso: CursoRequest):
    nuevo = {
        "titulo": curso.titulo.strip(),
        "descripcion": curso.descripcion or "",
        "pdf_url": curso.pdf_url or "",
        "clases": curso.clases or [],
    }
    res = cursos.insert_one(nuevo)
    nuevo["_id"] = str(res.inserted_id)
    return {"message": "Curso agregado ✅", "curso": custom_jsonable_encoder(nuevo)}

# Listar todos los cursos
@router.get("/")
def listar_cursos():
    lista = list(cursos.find())
    for c in lista:
        c["_id"] = str(c["_id"])
    return {"cursos": custom_jsonable_encoder(lista)}

# Obtener un curso por ID
@router.get("/{curso_id}")
def obtener_curso(curso_id: str):
    try:
        curso = cursos.find_one({"_id": ObjectId(curso_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")

    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    curso["_id"] = str(curso["_id"])
    return {"curso": custom_jsonable_encoder(curso)}

# Actualizar un curso
@router.put("/{curso_id}")
def actualizar_curso(curso_id: str, curso: CursoRequest):
    try:
        oid = ObjectId(curso_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")

    update_doc = {
        "titulo": curso.titulo.strip(),
        "descripcion": curso.descripcion or "",
        "pdf_url": curso.pdf_url or "",
        "clases": curso.clases or [],
    }

    result = cursos.update_one({"_id": oid}, {"$set": update_doc})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    return {"message": "Curso actualizado ✅"}

# Eliminar un curso
@router.delete("/{curso_id}")
def eliminar_curso(curso_id: str):
    try:
        oid = ObjectId(curso_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")

    result = cursos.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    return {"message": "Curso eliminado ✅"}
