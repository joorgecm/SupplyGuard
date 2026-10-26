# SupplyGuard

> Proyecto personal de portfolio inspirado en la gestión de calidad de entrada en una fábrica. Web para registrar piezas defectuosas de proveedores, analizar sus causas, seguir planes de acción correctiva y medir resultados con KPIs. Hecho con FastAPI, PostgreSQL, roles con JWT y Next.js.

SupplyGuard es una aplicación web para registrar, analizar, resolver y medir las incidencias causadas por piezas defectuosas recibidas de proveedores.

Flujo de una incidencia: `abierta → en análisis → acción correctiva → cerrada`.

## Stack tecnológico

- **Backend:** FastAPI, Pydantic, SQLAlchemy 2.0, Alembic
- **Base de datos:** PostgreSQL (alojada en [Neon](https://neon.tech))

## Primeros pasos

Requisitos: Python 3.13+ y una base de datos PostgreSQL (por ejemplo, un proyecto gratuito de [Neon](https://neon.tech)).

```bash
cp .env.example .env          # después pon en DATABASE_URL tu cadena de conexión
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload # documentación de la API en http://localhost:8000/docs

