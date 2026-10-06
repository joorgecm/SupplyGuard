"""Crea el primer usuario admin (solo un admin puede crear usuarios desde la API).

Uso, desde backend/: python -m app.scripts.create_admin --email admin@example.com --name "Admin"
"""

import argparse
import getpass
import sys

from pydantic import ValidationError

from app.core.database import SessionLocal
from app.core.exceptions import ConflictError
from app.models.enums import Role
from app.schemas.user_schema import UserCreate
from app.services import user_service


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()

    # getpass pide la contraseña sin mostrarla en pantalla ni dejarla en el historial
    password = getpass.getpass("Password (min 8 characters): ")

    try:
        data = UserCreate(full_name=args.name, email=args.email, password=password, role=Role.ADMIN)
    except ValidationError as exc:
        sys.exit(f"Invalid data:\n{exc}")

    with SessionLocal() as db:
        try:
            user = user_service.create_user(db, data)
        except ConflictError as exc:
            sys.exit(str(exc))

    print(f"Admin created: {user.email} (id {user.id})")


if __name__ == "__main__":
    main()
