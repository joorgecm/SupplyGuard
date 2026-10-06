from typing import Annotated

from fastapi import APIRouter, status

from app.api.deps import DbSession, require_roles
from app.models import User
from app.models.enums import Role
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"], dependencies=[require_roles(Role.ADMIN)])


@router.get("", response_model=list[UserRead])
def list_users(db: DbSession, active: bool | None = None, role: Role | None = None):
    return user_service.list_users(db, active, role)


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: DbSession):
    return user_service.get_user(db, user_id)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: DbSession):
    return user_service.create_user(db, data)


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: DbSession,
    current_user: Annotated[User, require_roles(Role.ADMIN)],
):
    return user_service.update_user(db, user_id, data, current_user)
