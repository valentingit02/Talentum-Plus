# Talentum+  
**Arquitectura Políglota con MongoDB, Cassandra y Neo4j**

Este proyecto implementa un sistema académico/práctico para simular una plataforma de gestión de talento (**Talentum+**).  
El objetivo es demostrar cómo diferentes bases de datos NoSQL pueden integrarse en un mismo backend utilizando **FastAPI**, y encapsularse con **Docker**.

---

## Tecnologías utilizadas

- **Backend**: Python 3.11 + FastAPI
- **Bases de datos**:
  - **MongoDB** → datos principales (usuarios, empresas, posiciones, capacitaciones)
  - **Cassandra** → historial y procesos distribuidos
  - **Neo4j** → relaciones de usuarios, skills y posiciones
- **Drivers**:
  - `pymongo` (MongoDB)
  - `cassandra-driver` (Cassandra)
  - `neo4j` (Neo4j)
- **Docker Compose** → orquestación de contenedores

---

## Requisitos previos

1. Tener instalado:
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [Python 3.11+](https://www.python.org/downloads/)
   - [Git](https://git-scm.com/)
2. Clonar el repositorio:
   ```bash
   git clone https://github.com/usuario/talentum-plus.git
   cd talentum-plus
