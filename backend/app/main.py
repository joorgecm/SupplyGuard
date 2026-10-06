from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api import action_plans, auth, incidents, parts, suppliers, tasks, users
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
)

app = FastAPI(title=settings.app_name, version="0.1.0")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(suppliers.router)
app.include_router(parts.router)
app.include_router(incidents.router)
app.include_router(action_plans.router)
app.include_router(tasks.router)


# Traducen los errores de los servicios a respuestas HTTP
@app.exception_handler(NotFoundError)
def not_found_handler(_: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
def conflict_handler(_: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})


@app.exception_handler(BusinessRuleError)
def business_rule_handler(_: Request, exc: BusinessRuleError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})


@app.exception_handler(PermissionDeniedError)
def permission_denied_handler(_: Request, exc: PermissionDeniedError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})


@app.get("/health", tags=["health"])
def health(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc
    return {"status": "ok", "database": "ok"}
