from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, get_current_user, require_roles
from app.models import User
from app.models.enums import IncidentStatus, Role, Severity
from app.schemas.incident_schema import (
    IncidentCreate,
    IncidentDetail,
    IncidentRead,
    IncidentStatusChange,
    IncidentUpdate,
)
from app.services import incident_service

router = APIRouter(
    prefix="/incidents", tags=["incidents"], dependencies=[Depends(get_current_user)]
)

Engineer = Annotated[User, require_roles(Role.ENGINEER, Role.ADMIN)]


@router.get("", response_model=list[IncidentRead])
def list_incidents(
    db: DbSession,
    status: IncidentStatus | None = None,
    severity: Severity | None = None,
    supplier_id: int | None = None,
):
    return incident_service.list_incidents(db, status, severity, supplier_id)


@router.get("/{incident_id}", response_model=IncidentDetail)
def get_incident(incident_id: int, db: DbSession):
    return incident_service.get_incident(db, incident_id)


@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident(data: IncidentCreate, db: DbSession, current_user: CurrentUser):
    return incident_service.create_incident(db, data, current_user)


@router.patch("/{incident_id}", response_model=IncidentRead)
def update_incident(incident_id: int, data: IncidentUpdate, db: DbSession, user: Engineer):
    return incident_service.update_incident(db, incident_id, data, user)


@router.patch("/{incident_id}/status", response_model=IncidentRead)
def change_status(incident_id: int, data: IncidentStatusChange, db: DbSession, user: Engineer):
    return incident_service.change_status(db, incident_id, data.status, user)
