from fastapi.testclient import TestClient


def create_supplier(client: TestClient, name: str = "Metalex") -> dict:
    response = client.post("/suppliers", json={"name": name})
    assert response.status_code == 201
    return response.json()


def create_part(client: TestClient, supplier_id: int, reference: str = "BRK-001", **extra) -> dict:
    payload = {"supplier_id": supplier_id, "reference": reference, "lot": "L-100", **extra}
    response = client.post("/parts", json=payload)
    assert response.status_code == 201
    return response.json()


def test_create_part_includes_supplier(client: TestClient):
    supplier = create_supplier(client)

    response = client.post(
        "/parts",
        json={"supplier_id": supplier["id"], "reference": " BRK-001 ", "lot": "L-100"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["reference"] == "BRK-001"
    assert body["description"] is None
    assert body["supplier"] == supplier


def test_create_part_with_missing_supplier_returns_404(client: TestClient):
    response = client.post("/parts", json={"supplier_id": 999999, "reference": "X", "lot": "1"})

    assert response.status_code == 404


def test_create_part_with_inactive_supplier_returns_400(client: TestClient):
    supplier = create_supplier(client)
    client.patch(f"/suppliers/{supplier['id']}", json={"is_active": False})

    response = client.post(
        "/parts", json={"supplier_id": supplier["id"], "reference": "X", "lot": "1"}
    )

    assert response.status_code == 400


def test_create_duplicate_part_returns_409(client: TestClient):
    supplier = create_supplier(client)
    create_part(client, supplier["id"])

    response = client.post(
        "/parts", json={"supplier_id": supplier["id"], "reference": "BRK-001", "lot": "L-100"}
    )

    assert response.status_code == 409


def test_same_reference_and_lot_allowed_for_other_supplier(client: TestClient):
    first = create_supplier(client, "Metalex")
    second = create_supplier(client, "Plastica")
    create_part(client, first["id"])

    create_part(client, second["id"])


def test_get_part_and_missing_part(client: TestClient):
    part = create_part(client, create_supplier(client)["id"])

    assert client.get(f"/parts/{part['id']}").json() == part
    assert client.get("/parts/999999").status_code == 404


def test_list_parts_filters_by_supplier_and_reference(client: TestClient):
    first = create_supplier(client, "Metalex")
    second = create_supplier(client, "Plastica")
    bracket = create_part(client, first["id"], "BRK-001")
    screw = create_part(client, first["id"], "SCR-002")
    other = create_part(client, second["id"], "BRK-001")

    by_supplier = [p["id"] for p in client.get(f"/parts?supplier_id={first['id']}").json()]
    by_reference = [p["id"] for p in client.get("/parts?reference=BRK-001").json()]

    assert bracket["id"] in by_supplier and screw["id"] in by_supplier
    assert other["id"] not in by_supplier
    assert bracket["id"] in by_reference and other["id"] in by_reference
    assert screw["id"] not in by_reference


def test_update_part_changes_only_sent_fields(client: TestClient):
    part = create_part(client, create_supplier(client)["id"], description="Steel bracket")

    response = client.patch(f"/parts/{part['id']}", json={"lot": "L-200"})

    assert response.status_code == 200
    assert response.json()["lot"] == "L-200"
    assert response.json()["description"] == "Steel bracket"


def test_update_part_to_existing_reference_and_lot_returns_409(client: TestClient):
    supplier_id = create_supplier(client)["id"]
    create_part(client, supplier_id, "BRK-001")
    other = create_part(client, supplier_id, "SCR-002")

    response = client.patch(f"/parts/{other['id']}", json={"reference": "BRK-001"})

    assert response.status_code == 409


def test_update_part_rejects_null_reference(client: TestClient):
    part = create_part(client, create_supplier(client)["id"])

    assert client.patch(f"/parts/{part['id']}", json={"reference": None}).status_code == 422
