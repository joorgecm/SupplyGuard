from fastapi import APIRouter, Depends, status

from app.api.deps import DbSession, get_current_user, require_roles
from app.models.enums import Role
from app.schemas.part_schema import PartCreate, PartRead, PartUpdate
from app.services import part_service

# Cualquier usuario autenticado puede consultar; solo admin crea o modifica
router = APIRouter(prefix="/parts", tags=["parts"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[PartRead])
def list_parts(db: DbSession, supplier_id: int | None = None, reference: str | None = None):
    return part_service.list_parts(db, supplier_id, reference)


@router.get("/{part_id}", response_model=PartRead)
def get_part(part_id: int, db: DbSession):
    return part_service.get_part(db, part_id)


@router.post(
    "",
    response_model=PartRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_roles(Role.ADMIN)],
)
def create_part(data: PartCreate, db: DbSession):
    return part_service.create_part(db, data)


@router.patch("/{part_id}", response_model=PartRead, dependencies=[require_roles(Role.ADMIN)])
def update_part(part_id: int, data: PartUpdate, db: DbSession):
    return part_service.update_part(db, part_id, data)
