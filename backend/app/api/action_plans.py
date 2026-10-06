from fastapi import APIRouter, Depends, status

from app.api.deps import DbSession, Engineer, get_current_user
from app.schemas.action_plan_schema import ActionPlanCreate, ActionPlanRead, ActionPlanUpdate
from app.schemas.task_schema import TaskCreate, TaskRead
from app.services import action_plan_service, task_service

router = APIRouter(tags=["action plans"], dependencies=[Depends(get_current_user)])


@router.get("/incidents/{incident_id}/action-plan", response_model=ActionPlanRead)
def get_action_plan(incident_id: int, db: DbSession):
    return action_plan_service.get_action_plan_by_incident(db, incident_id)


@router.post(
    "/incidents/{incident_id}/action-plan",
    response_model=ActionPlanRead,
    status_code=status.HTTP_201_CREATED,
)
def create_action_plan(incident_id: int, data: ActionPlanCreate, db: DbSession, user: Engineer):
    return action_plan_service.create_action_plan(db, incident_id, data, user)


@router.patch("/action-plans/{plan_id}", response_model=ActionPlanRead)
def update_action_plan(plan_id: int, data: ActionPlanUpdate, db: DbSession, user: Engineer):
    return action_plan_service.update_action_plan(db, plan_id, data, user)


@router.post(
    "/action-plans/{plan_id}/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED
)
def add_task(plan_id: int, data: TaskCreate, db: DbSession, user: Engineer):
    return task_service.add_task(db, plan_id, data, user)
