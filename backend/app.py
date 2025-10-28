from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, companies, positions, skills, dashboard, historial, seleccion, catalogo  

app = FastAPI(title="Talentum+ - MVP Políglota")

# Manejo de CORS (para permitir peticiones desde el front en localhost:5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(positions.router)
app.include_router(skills.router)
app.include_router(dashboard.router)
app.include_router(historial.router)   
app.include_router(seleccion.router)   
app.include_router(catalogo.router)  

@app.get("/")
def home():
    return {"message": "Talentum+ API Running ✅"}
