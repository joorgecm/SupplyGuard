from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.models import Task, User
from app.models.enums import Role
from app.schemas.task_schema import TaskCreate, TaskUpdate
from app.services import action_plan_service, incident_service, user_service
from app.services.incident_history_service import record_event


def get_task(db: Session, task_id: int) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise NotFoundError("Task", task_id)
    return task


def add_task(db: Session, plan_id: int, data: TaskCreate, current_user: User) -> Task:
    plan = action_plan_service.get_action_plan(db, plan_id)
    incident_service.ensure_not_closed(plan.incident)
    user_service.get_active_user(db, data.assigned_to_id)
    task = Task(**data.model_dump(), action_plan=plan)
    db.add(task)
    record_event(db, plan.incident, current_user, "task_added")
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task_id: int, data: TaskUpdate, current_user: User) -> Task:
    task = get_task(db, task_id)
    incident = task.action_plan.incident
    incident_service.ensure_not_closed(incident)
    changes = data.model_dump(exclude_unset=True)
    _ensure_can_update(task, changes, current_user)
    if "assigned_to_id" in changes:
        user_service.get_active_user(db, changes["assigned_to_id"])

    action = "task_updated"
    if "completed" in changes:
        # El cliente envía completed: true/false; en la BD se guarda la fecha en que se completó
        completed = changes.pop("completed")
        if completed and task.completed_at is None:
            task.completed_at = datetime.now(UTC)
            action = "task_completed"
        elif not completed and task.completed_at is not None:
            task.completed_at = None
            action = "task_reopened"
    for field, value in changes.items():
        setattr(task, field, value)

    record_event(db, incident, current_user, action)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, current_user: User) -> None:
    task = get_task(db, task_id)
    incident = task.action_plan.incident
    incident_service.ensure_not_closed(incident)
    db.delete(task)
    record_event(db, incident, current_user, "task_deleted")
    db.commit()


def _ensure_can_update(task: Task, changes: dict, current_user: User) -> None:
    # Ingenieros y admins editan cualquier tarea; el responsable solo puede marcar la suya
    if current_user.role in (Role.ENGINEER, Role.ADMIN):
        return
    if task.assigned_to_id != current_user.id:
        raise PermissionDeniedError("Only engineers or the assignee can update this task")
    if set(changes) - {"completed"}:
        raise PermissionDeniedError("The assignee can only mark the task as completed or not")
