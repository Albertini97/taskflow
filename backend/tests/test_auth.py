"""Tests for authentication endpoints."""


def test_register_success(client):
    res = client.post("/auth/register", json={
        "email": "new@test.com",
        "username": "newuser",
        "password": "password123",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new@test.com"
    assert data["username"] == "newuser"
    assert "id" in data
    assert "hashed_password" not in data  # Never expose password


def test_register_duplicate_email(client, registered_user):
    res = client.post("/auth/register", json={
        "email": registered_user["email"],
        "username": "different",
        "password": "pass123",
    })
    assert res.status_code == 400
    assert "Email" in res.json()["detail"]


def test_register_duplicate_username(client, registered_user):
    res = client.post("/auth/register", json={
        "email": "other@test.com",
        "username": registered_user["username"],
        "password": "pass123",
    })
    assert res.status_code == 400


def test_login_success(client, registered_user):
    res = client.post("/auth/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"],
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, registered_user):
    res = client.post("/auth/login", json={
        "email": registered_user["email"],
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post("/auth/login", json={
        "email": "nobody@test.com",
        "password": "pass123",
    })
    assert res.status_code == 401


def test_me_authenticated(client, auth_headers):
    res = client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "test@test.com"


def test_me_unauthenticated(client):
    res = client.get("/auth/me")
    assert res.status_code == 403
