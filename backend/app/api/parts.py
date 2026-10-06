from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.part_schema import PartCreate, PartRead, PartUpdate
from app.services import part_service

router = APIRouter(prefix="/parts", tags=["parts"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[PartRead])
def list_parts(db: DbSession, supplier_id: int | None = None, reference: str | None = None):
    return part_service.list_parts(db, supplier_id, reference)


@router.get("/{part_id}", response_model=PartRead)
def get_part(part_id: int, db: DbSession):
    return part_service.get_part(db, part_id)


@router.post("", response_model=PartRead, status_code=status.HTTP_201_CREATED)
def create_part(data: PartCreate, db: DbSession):
    return part_service.create_part(db, data)


@router.patch("/{part_id}", response_model=PartRead)
def update_part(part_id: int, data: PartUpdate, db: DbSession):
    return part_service.update_part(db, part_id, data)
