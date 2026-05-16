"""Tests for task CRUD endpoints."""


def test_create_task(client, auth_headers):
    res = client.post("/tasks/", json={"title": "Mi primera tarea"}, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Mi primera tarea"
    assert data["status"] == "pending"


def test_get_tasks_empty(client, auth_headers):
    res = client.get("/tasks/", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


def test_get_tasks_returns_own(client, auth_headers):
    client.post("/tasks/", json={"title": "Tarea 1"}, headers=auth_headers)
    client.post("/tasks/", json={"title": "Tarea 2"}, headers=auth_headers)
    res = client.get("/tasks/", headers=auth_headers)
    assert len(res.json()) == 2


def test_update_task_status(client, auth_headers):
    create = client.post("/tasks/", json={"title": "Tarea"}, headers=auth_headers)
    task_id = create.json()["id"]
    res = client.put(f"/tasks/{task_id}", json={"status": "done"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "done"


def test_update_task_title(client, auth_headers):
    create = client.post("/tasks/", json={"title": "Original"}, headers=auth_headers)
    task_id = create.json()["id"]
    res = client.put(f"/tasks/{task_id}", json={"title": "Actualizado"}, headers=auth_headers)
    assert res.json()["title"] == "Actualizado"


def test_delete_task(client, auth_headers):
    create = client.post("/tasks/", json={"title": "A borrar"}, headers=auth_headers)
    task_id = create.json()["id"]
    res = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert res.status_code == 204
    # Verify it's gone
    tasks = client.get("/tasks/", headers=auth_headers).json()
    assert not any(t["id"] == task_id for t in tasks)


def test_delete_task_not_owner(client, auth_headers):
    """Another user cannot delete someone else's task."""
    create = client.post("/tasks/", json={"title": "Mía"}, headers=auth_headers)
    task_id = create.json()["id"]

    # Register a second user
    client.post("/auth/register", json={
        "email": "other@test.com", "username": "other", "password": "pass123"
    })
    login = client.post("/auth/login", json={"email": "other@test.com", "password": "pass123"})
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = client.delete(f"/tasks/{task_id}", headers=other_headers)
    assert res.status_code == 403


def test_tasks_require_auth(client):
    res = client.get("/tasks/")
    assert res.status_code == 403


def test_pagination(client, auth_headers):
    for i in range(5):
        client.post("/tasks/", json={"title": f"Tarea {i}"}, headers=auth_headers)
    res = client.get("/tasks/?skip=0&limit=3", headers=auth_headers)
    assert len(res.json()) == 3
