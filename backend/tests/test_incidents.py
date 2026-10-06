import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def part(client: TestClient) -> dict:
    supplier = client.post("/suppliers", json={"name": "Metalex"}).json()
    payload = {"supplier_id": supplier["id"], "reference": "BRK-001", "lot": "L-100"}
    return client.post("/parts", json=payload).json()


def create_incident(client: TestClient, part_id: int, **extra) -> dict:
    payload = {
        "part_id": part_id,
        "title": "Off-center holes",
        "description": "Batch arrived with off-center holes",
        "severity": "high",
        **extra,
    }
    response = client.post("/incidents", json=payload)
    assert response.status_code == 201
    return response.json()


def test_operator_creates_open_incident(operator_client: TestClient, part: dict):
    incident = create_incident(operator_client, part["id"])
    me = operator_client.get("/auth/me").json()

    assert incident["status"] == "open"
    assert incident["part"]["id"] == part["id"]
    assert incident["reported_by"]["id"] == me["id"]
    assert incident["analyzed_by"] is None
    assert incident["closed_at"] is None


def test_create_incident_records_history(client: TestClient, part: dict):
    incident = create_incident(client, part["id"])

    detail = client.get(f"/incidents/{incident['id']}").json()

    assert detail["action_plan"] is None
    assert [event["action"] for event in detail["history"]] == ["created"]
    assert detail["history"][0]["to_status"] == "open"


def test_create_incident_with_missing_part_returns_404(client: TestClient):
    response = client.post(
        "/incidents",
        json={"part_id": 999999, "title": "X", "description": "X", "severity": "low"},
    )

    assert response.status_code == 404


def test_create_incident_with_invalid_data_returns_422(client: TestClient, part: dict):
    base = {"part_id": part["id"], "title": "X", "description": "X", "severity": "low"}

    assert client.post("/incidents", json={**base, "severity": "urgent"}).status_code == 422
    assert client.post("/incidents", json={**base, "title": ""}).status_code == 422


def test_get_missing_incident_returns_404(client: TestClient):
    assert client.get("/incidents/999999").status_code == 404


def test_list_incidents_filters(client: TestClient, part: dict):
    other_supplier = client.post("/suppliers", json={"name": "Plastica"}).json()
    other_part = client.post(
        "/parts", json={"supplier_id": other_supplier["id"], "reference": "X", "lot": "1"}
    ).json()
    high = create_incident(client, part["id"], severity="high")
    low = create_incident(client, other_part["id"], severity="low")
    client.patch(f"/incidents/{low['id']}/status", json={"status": "in_analysis"})

    def ids(**params) -> list[int]:
        return [i["id"] for i in client.get("/incidents", params=params).json()]

    assert high["id"] in ids(severity="high") and low["id"] not in ids(severity="high")
    assert low["id"] in ids(status="in_analysis") and high["id"] not in ids(status="in_analysis")
    by_supplier = ids(supplier_id=part["supplier"]["id"])
    assert high["id"] in by_supplier and low["id"] not in by_supplier


def test_update_incident_changes_only_sent_fields(client: TestClient, part: dict):
    incident = create_incident(client, part["id"])

    response = client.patch(f"/incidents/{incident['id']}", json={"severity": "critical"})

    assert response.status_code == 200
    assert response.json()["severity"] == "critical"
    assert response.json()["title"] == incident["title"]
    history = client.get(f"/incidents/{incident['id']}").json()["history"]
    assert [event["action"] for event in history] == ["created", "updated"]


def test_update_incident_rejects_null_title(client: TestClient, part: dict):
    incident = create_incident(client, part["id"])

    assert client.patch(f"/incidents/{incident['id']}", json={"title": None}).status_code == 422


def test_engineer_moves_incident_to_analysis(
    operator_client: TestClient, engineer_client: TestClient, part: dict
):
    incident = create_incident(operator_client, part["id"])

    response = engineer_client.patch(
        f"/incidents/{incident['id']}/status", json={"status": "in_analysis"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "in_analysis"
    engineer = engineer_client.get("/auth/me").json()
    assert response.json()["analyzed_by"]["id"] == engineer["id"]
    last_event = engineer_client.get(f"/incidents/{incident['id']}").json()["history"][-1]
    assert last_event["action"] == "status_changed"
    assert last_event["from_status"] == "open" and last_event["to_status"] == "in_analysis"


def test_invalid_status_transitions_return_400(client: TestClient, part: dict):
    incident = create_incident(client, part["id"])
    url = f"/incidents/{incident['id']}/status"

    assert client.patch(url, json={"status": "closed"}).status_code == 400
    assert client.patch(url, json={"status": "open"}).status_code == 400
    client.patch(url, json={"status": "in_analysis"})
    # Para pasar a acción correctiva hace falta un plan de acción
    assert client.patch(url, json={"status": "corrective_action"}).status_code == 400


def test_incidents_require_authentication(anon_client: TestClient):
    assert anon_client.get("/incidents").status_code == 401


def test_operator_can_create_and_read_but_not_modify(operator_client: TestClient, part: dict):
    incident = create_incident(operator_client, part["id"])
    url = f"/incidents/{incident['id']}"

    assert operator_client.get("/incidents").status_code == 200
    assert operator_client.get(url).status_code == 200
    assert operator_client.patch(url, json={"severity": "low"}).status_code == 403
    response = operator_client.patch(f"{url}/status", json={"status": "in_analysis"})
    assert response.status_code == 403
