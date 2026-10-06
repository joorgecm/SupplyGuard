import pytest
from fastapi.testclient import TestClient

from app.models.enums import Role
from tests.conftest import client_for
from tests.test_incidents import create_incident


@pytest.fixture
def incident(client: TestClient, part: dict) -> dict:
    """Incidencia ya analizada: lista para recibir un plan de acción."""
    incident = create_incident(client, part["id"])
    client.patch(f"/incidents/{incident['id']}/status", json={"status": "in_analysis"})
    return incident


@pytest.fixture
def assignee(make_user):
    return make_user(Role.OPERATOR)


def task_payload(assignee_id: int, title: str = "Inspect remaining stock") -> dict:
    return {"title": title, "assigned_to_id": assignee_id, "due_date": "2026-11-30"}


def create_plan(client: TestClient, incident_id: int, tasks: list[dict] | None = None) -> dict:
    response = client.post(
        f"/incidents/{incident_id}/action-plan",
        json={"description": "Contain and fix the drilling issue", "tasks": tasks or []},
    )
    assert response.status_code == 201
    return response.json()


def history_actions(client: TestClient, incident_id: int) -> list[str]:
    return [event["action"] for event in client.get(f"/incidents/{incident_id}").json()["history"]]


def test_create_plan_moves_incident_to_corrective_action(
    client: TestClient, incident: dict, assignee
):
    plan = create_plan(client, incident["id"], [task_payload(assignee.id)])

    assert plan["incident_id"] == incident["id"]
    assert len(plan["tasks"]) == 1
    assert plan["tasks"][0]["assigned_to"]["id"] == assignee.id
    assert plan["tasks"][0]["completed_at"] is None
    detail = client.get(f"/incidents/{incident['id']}").json()
    assert detail["status"] == "corrective_action"
    assert detail["action_plan"]["id"] == plan["id"]
    assert history_actions(client, incident["id"])[-1] == "action_plan_created"


def test_create_plan_twice_returns_409(client: TestClient, incident: dict):
    create_plan(client, incident["id"])

    response = client.post(f"/incidents/{incident['id']}/action-plan", json={"description": "X"})

    assert response.status_code == 409


def test_create_plan_for_open_incident_returns_400(client: TestClient, part: dict):
    incident = create_incident(client, part["id"])

    response = client.post(f"/incidents/{incident['id']}/action-plan", json={"description": "X"})

    assert response.status_code == 400


def test_create_plan_with_invalid_assignee(client: TestClient, incident: dict, make_user):
    url = f"/incidents/{incident['id']}/action-plan"
    inactive = make_user(is_active=False)

    missing = client.post(url, json={"description": "X", "tasks": [task_payload(999999)]})
    not_active = client.post(url, json={"description": "X", "tasks": [task_payload(inactive.id)]})

    assert missing.status_code == 404
    assert not_active.status_code == 400


def test_get_plan_and_missing_plan(client: TestClient, incident: dict):
    url = f"/incidents/{incident['id']}/action-plan"
    assert client.get(url).status_code == 404

    plan = create_plan(client, incident["id"])

    assert client.get(url).json() == plan


def test_update_plan_description(client: TestClient, incident: dict):
    plan = create_plan(client, incident["id"])
    url = f"/action-plans/{plan['id']}"

    response = client.patch(url, json={"description": "New description"})

    assert response.status_code == 200
    assert response.json()["description"] == "New description"
    assert client.patch(url, json={"description": None}).status_code == 422


def test_add_update_and_delete_tasks(client: TestClient, incident: dict, assignee):
    plan = create_plan(client, incident["id"])

    added = client.post(f"/action-plans/{plan['id']}/tasks", json=task_payload(assignee.id))
    assert added.status_code == 201
    task_url = f"/tasks/{added.json()['id']}"

    updated = client.patch(task_url, json={"title": "Sort the whole batch"})
    assert updated.json()["title"] == "Sort the whole batch"
    completed = client.patch(task_url, json={"completed": True})
    assert completed.json()["completed_at"] is not None
    reopened = client.patch(task_url, json={"completed": False})
    assert reopened.json()["completed_at"] is None
    assert client.delete(task_url).status_code == 204
    assert client.get(f"/incidents/{incident['id']}/action-plan").json()["tasks"] == []

    assert history_actions(client, incident["id"])[-5:] == [
        "task_added",
        "task_updated",
        "task_completed",
        "task_reopened",
        "task_deleted",
    ]


def test_missing_task_returns_404(client: TestClient):
    assert client.patch("/tasks/999999", json={"completed": True}).status_code == 404
    assert client.delete("/tasks/999999").status_code == 404


def test_assignee_can_complete_own_task_only(
    client: TestClient, incident: dict, assignee, make_user
):
    plan = create_plan(client, incident["id"], [task_payload(assignee.id)])
    task_url = f"/tasks/{plan['tasks'][0]['id']}"
    assignee_client = client_for(assignee)
    other_operator_client = client_for(make_user(Role.OPERATOR))

    assert assignee_client.patch(task_url, json={"completed": True}).status_code == 200
    assert assignee_client.patch(task_url, json={"title": "Other"}).status_code == 403
    assert assignee_client.delete(task_url).status_code == 403
    assert other_operator_client.patch(task_url, json={"completed": False}).status_code == 403


def test_full_incident_lifecycle(
    operator_client: TestClient, engineer_client: TestClient, part: dict, assignee
):
    incident = create_incident(operator_client, part["id"])
    status_url = f"/incidents/{incident['id']}/status"
    engineer_client.patch(status_url, json={"status": "in_analysis"})
    plan = create_plan(engineer_client, incident["id"])

    # No se puede cerrar sin tareas ni con tareas pendientes
    assert engineer_client.patch(status_url, json={"status": "closed"}).status_code == 400
    task = engineer_client.post(
        f"/action-plans/{plan['id']}/tasks", json=task_payload(assignee.id)
    ).json()
    assert engineer_client.patch(status_url, json={"status": "closed"}).status_code == 400

    client_for(assignee).patch(f"/tasks/{task['id']}", json={"completed": True})
    closed = engineer_client.patch(status_url, json={"status": "closed"})

    assert closed.status_code == 200
    assert closed.json()["status"] == "closed"
    assert closed.json()["closed_at"] is not None
    # Una incidencia cerrada ya no se puede modificar
    incident_url = f"/incidents/{incident['id']}"
    assert engineer_client.patch(incident_url, json={"title": "X"}).status_code == 400
    plan_url = f"/action-plans/{plan['id']}"
    assert engineer_client.patch(plan_url, json={"description": "X"}).status_code == 400
    task_url = f"/tasks/{task['id']}"
    assert engineer_client.patch(task_url, json={"completed": False}).status_code == 400
    assert (
        engineer_client.post(f"{plan_url}/tasks", json=task_payload(assignee.id)).status_code == 400
    )
    assert engineer_client.delete(task_url).status_code == 400


def test_action_plans_permissions(
    anon_client: TestClient, operator_client: TestClient, client: TestClient, incident: dict
):
    url = f"/incidents/{incident['id']}/action-plan"

    assert anon_client.get(url).status_code == 401
    assert operator_client.post(url, json={"description": "X"}).status_code == 403
    plan = create_plan(client, incident["id"])
    assert operator_client.get(url).status_code == 200
    plan_url = f"/action-plans/{plan['id']}"
    assert operator_client.patch(plan_url, json={"description": "X"}).status_code == 403
    me = operator_client.get("/auth/me").json()
    response = operator_client.post(f"{plan_url}/tasks", json=task_payload(me["id"]))
    assert response.status_code == 403
