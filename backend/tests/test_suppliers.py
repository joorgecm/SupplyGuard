from fastapi.testclient import TestClient


def create_supplier(client: TestClient, name: str = "Metalex", **extra) -> dict:
    response = client.post("/suppliers", json={"name": name, **extra})
    assert response.status_code == 201
    return response.json()


def test_create_supplier(client: TestClient):
    response = client.post(
        "/suppliers", json={"name": "  Metalex  ", "contact_email": "quality@metalex.com"}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Metalex"
    assert body["contact_email"] == "quality@metalex.com"
    assert body["is_active"] is True
    assert isinstance(body["id"], int)


def test_create_supplier_with_duplicate_name_returns_409(client: TestClient):
    create_supplier(client, "Metalex")

    response = client.post("/suppliers", json={"name": "METALEX"})

    assert response.status_code == 409


def test_create_supplier_with_invalid_data_returns_422(client: TestClient):
    assert client.post("/suppliers", json={"name": ""}).status_code == 422
    response = client.post("/suppliers", json={"name": "Metalex", "contact_email": "nope"})
    assert response.status_code == 422


def test_get_supplier(client: TestClient):
    supplier = create_supplier(client)

    response = client.get(f"/suppliers/{supplier['id']}")

    assert response.status_code == 200
    assert response.json() == supplier


def test_get_missing_supplier_returns_404(client: TestClient):
    response = client.get("/suppliers/999999")

    assert response.status_code == 404


def test_list_suppliers_filters_by_active(client: TestClient):
    active = create_supplier(client, "Active Supplier")
    inactive = create_supplier(client, "Inactive Supplier")
    client.patch(f"/suppliers/{inactive['id']}", json={"is_active": False})

    all_ids = [s["id"] for s in client.get("/suppliers").json()]
    active_ids = [s["id"] for s in client.get("/suppliers", params={"active": True}).json()]

    assert active["id"] in all_ids and inactive["id"] in all_ids
    assert active["id"] in active_ids
    assert inactive["id"] not in active_ids


def test_update_supplier_changes_only_sent_fields(client: TestClient):
    supplier = create_supplier(client, contact_email="old@metalex.com")

    response = client.patch(f"/suppliers/{supplier['id']}", json={"name": "Metalex S.A."})

    assert response.status_code == 200
    assert response.json()["name"] == "Metalex S.A."
    assert response.json()["contact_email"] == "old@metalex.com"


def test_update_supplier_can_clear_email(client: TestClient):
    supplier = create_supplier(client, contact_email="old@metalex.com")

    response = client.patch(f"/suppliers/{supplier['id']}", json={"contact_email": None})

    assert response.json()["contact_email"] is None


def test_update_supplier_rejects_null_name(client: TestClient):
    supplier = create_supplier(client)

    response = client.patch(f"/suppliers/{supplier['id']}", json={"name": None})

    assert response.status_code == 422


def test_update_supplier_with_taken_name_returns_409(client: TestClient):
    create_supplier(client, "Metalex")
    other = create_supplier(client, "Plastica")

    response = client.patch(f"/suppliers/{other['id']}", json={"name": "metalex"})

    assert response.status_code == 409


def test_update_missing_supplier_returns_404(client: TestClient):
    response = client.patch("/suppliers/999999", json={"name": "Ghost"})

    assert response.status_code == 404


def test_suppliers_require_authentication(anon_client: TestClient):
    assert anon_client.get("/suppliers").status_code == 401
    assert anon_client.post("/suppliers", json={"name": "Metalex"}).status_code == 401


def test_operator_can_read_but_not_modify_suppliers(
    client: TestClient, operator_client: TestClient
):
    supplier = create_supplier(client)

    assert operator_client.get("/suppliers").status_code == 200
    assert operator_client.get(f"/suppliers/{supplier['id']}").status_code == 200
    assert operator_client.post("/suppliers", json={"name": "Other"}).status_code == 403
    response = operator_client.patch(f"/suppliers/{supplier['id']}", json={"name": "New"})
    assert response.status_code == 403
