from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession, Engineer
from app.schemas.task_schema import TaskRead, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


# Cualquier usuario logueado entra; el servicio decide si puede editar esta tarea
@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, data: TaskUpdate, db: DbSession, user: CurrentUser):
    return task_service.update_task(db, task_id, data, user)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: DbSession, user: Engineer) -> None:
    task_service.delete_task(db, task_id, user)
