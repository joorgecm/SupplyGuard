# SupplyGuard

> Proyecto personal de portfolio inspirado en la gestión de calidad de entrada (incoming quality) en una fábrica.

SupplyGuard es una aplicación web para **registrar, analizar, resolver y medir incidencias** causadas por piezas defectuosas que llegan de proveedores.

Imagina que un operario detecta que un lote de soportes del proveedor "Metalex" llega con agujeros descentrados. Crea una incidencia con la pieza, el lote, el proveedor, la severidad, una descripción y una foto. Un ingeniero la analiza, crea un plan de acción con tareas (cada una con responsable y fecha límite) y, cuando todas las tareas están completadas, cierra la incidencia. Todo queda registrado en el historial y se puede descargar una ficha en PDF. Un panel muestra los indicadores clave (KPIs).

## Flujo de una incidencia

abierta → en análisis → acción correctiva → cerrada


## Roles

| Rol       | Puede                                                                 |
| --------- | --------------------------------------------------------------------- |
| operario  | Crear y consultar incidencias                                         |
| ingeniero | Analizar incidencias, crear planes de acción y cambiar estados        |
| admin     | Gestionar usuarios, proveedores y piezas (además de lo anterior)      |

## Indicadores (KPIs)

- Incidencias abiertas.
- Tiempo medio de cierre.
- Ranking de proveedores por número de incidencias.

## Stack tecnológico

- **Backend:** FastAPI + Pydantic, SQLAlchemy 2.0, Alembic
- **Base de datos:** PostgreSQL alojado en [Neon](https://neon.tech)
- **Autenticación:** JWT (OAuth2 con contraseña) con roles
- **Frontend (en desarrollo):** Next.js + Recharts
- **Planificado:** WeasyPrint (PDF), avisos a Teams/Discord, exportación a BigQuery y dashboard en Looker Studio

## Primeros pasos

Requisitos: Python 3.13+ y una base de datos PostgreSQL (por ejemplo, un proyecto gratuito en [Neon](https://neon.tech)).

```bash
# 1. Copia la plantilla de variables de entorno y pon tu cadena de conexión en DATABASE_URL
cp .env.example .env

# 2. Entra en el backend y crea un entorno virtual
cd backend
python -m venv .venv
source .venv/bin/activate     # En Windows: .venv\Scripts\activate

# 3. Instala las dependencias
pip install -e ".[dev]"

# 4. Arranca la API
uvicorn app.main:app --reload


