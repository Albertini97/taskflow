"""Tests for team endpoints."""


def test_create_team(client, auth_headers):
    res = client.post("/teams/", json={"name": "Dev Team"}, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["name"] == "Dev Team"


def test_creator_is_owner_member(client, auth_headers):
    res = client.post("/teams/", json={"name": "Mi equipo"}, headers=auth_headers)
    team = res.json()
    assert len(team["members"]) == 1
    assert team["members"][0]["role"] == "owner"


def test_get_my_teams(client, auth_headers):
    client.post("/teams/", json={"name": "Team A"}, headers=auth_headers)
    client.post("/teams/", json={"name": "Team B"}, headers=auth_headers)
    res = client.get("/teams/", headers=auth_headers)
    assert len(res.json()) == 2


def test_invite_member(client, auth_headers):
    team = client.post("/teams/", json={"name": "Equipo"}, headers=auth_headers).json()

    # Register invitee
    client.post("/auth/register", json={
        "email": "invitado@test.com", "username": "invitado", "password": "pass123"
    })

    res = client.post(
        f"/teams/{team['id']}/invite",
        json={"email": "invitado@test.com"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert "añadido" in res.json()["message"]


def test_invite_nonexistent_user(client, auth_headers):
    team = client.post("/teams/", json={"name": "Equipo"}, headers=auth_headers).json()
    res = client.post(
        f"/teams/{team['id']}/invite",
        json={"email": "noexiste@test.com"},
        headers=auth_headers,
    )
    assert res.status_code == 404


def test_only_owner_can_invite(client, auth_headers):
    team = client.post("/teams/", json={"name": "Equipo"}, headers=auth_headers).json()

    # Second user
    client.post("/auth/register", json={
        "email": "other@test.com", "username": "other", "password": "pass123"
    })
    login = client.post("/auth/login", json={"email": "other@test.com", "password": "pass123"})
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = client.post(
        f"/teams/{team['id']}/invite",
        json={"email": "test@test.com"},
        headers=other_headers,
    )
    assert res.status_code == 403
