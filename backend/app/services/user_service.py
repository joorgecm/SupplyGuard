from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.core.security import hash_password
from app.models import User
from app.models.enums import Role
from app.schemas.user_schema import UserCreate, UserUpdate


def list_users(db: Session, active: bool | None = None, role: Role | None = None) -> list[User]:
    query = select(User).order_by(User.full_name)
    if active is not None:
        query = query.where(User.is_active == active)
    if role is not None:
        query = query.where(User.role == role)
    return list(db.scalars(query))


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("User", user_id)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def create_user(db: Session, data: UserCreate) -> User:
    _ensure_email_is_free(db, data.email)
    # La contraseña nunca se guarda tal cual, solo su hash
    user = User(**data.model_dump(exclude={"password"}), password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data: UserUpdate, current_user: User) -> User:
    user = get_user(db, user_id)
    changes = data.model_dump(exclude_unset=True)
    # Evita que un admin se bloquee a sí mismo y el sistema se quede sin admin
    if user.id == current_user.id and (
        changes.get("is_active") is False or changes.get("role", Role.ADMIN) != Role.ADMIN
    ):
        raise BusinessRuleError("You cannot deactivate yourself or remove your own admin role")
    if "password" in changes:
        user.password_hash = hash_password(changes.pop("password"))
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def _ensure_email_is_free(db: Session, email: str) -> None:
    if get_user_by_email(db, email) is not None:
        raise ConflictError(f"User with email '{email}' already exists")


def get_active_user(db: Session, user_id: int) -> User:
    user = get_user(db, user_id)
    if not user.is_active:
        raise BusinessRuleError(f"User {user_id} is not active")
    return user
