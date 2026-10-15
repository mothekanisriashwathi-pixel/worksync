"""Regression tests for defects found in the Phase 5 QA audit."""
import asyncio
from datetime import timedelta

import httpx
import pytest
from fastapi import HTTPException

from app.core import config
from app.core.security import create_access_token
from app.services import github
from conftest import login


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

def test_invalid_credentials_and_tokens(client):
    assert client.post("/auth/login", json={"email": "admin@test.com", "password": "wrong"}).status_code == 401
    assert client.post("/auth/login", json={"email": "nobody@test.com", "password": "x"}).status_code == 401

    client.cookies.clear()
    expired = create_access_token(user_id=1, role="ADMIN", expires_delta=timedelta(minutes=-1))
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer not-a-jwt"}).status_code == 401

    # A forged role claim does not grant admin: the role is read from the database.
    member_token_claiming_admin = create_access_token(user_id=4, role="ADMIN")
    res = client.get("/users", headers={"Authorization": f"Bearer {member_token_claiming_admin}"})
    assert res.status_code == 403


def test_register_rejects_overlong_fields(client):
    assert client.post("/auth/register", json={
        "name": "x" * 101, "email": "longname@test.com", "password": "password1",
    }).status_code == 422
    assert client.post("/auth/register", json={
        "name": "Ok", "email": "longpw@test.com", "password": "p" * 73,
    }).status_code == 422


def test_production_refuses_default_secret():
    prod = config.Settings(APP_ENV="production", SECRET_KEY=config.DEFAULT_SECRET_KEY)
    with pytest.raises(RuntimeError):
        config.check_production_settings(prod)
    config.check_production_settings(config.Settings(APP_ENV="production", SECRET_KEY="a-real-secret"))
    config.check_production_settings(config.Settings(APP_ENV="development"))


# ---------------------------------------------------------------------------
# Authorization / admin safety
# ---------------------------------------------------------------------------

def test_admin_cannot_lock_themselves_out(client):
    login(client, "admin@test.com", "admin123")
    assert client.patch("/users/1", json={"role": "MEMBER"}).status_code == 400
    assert client.patch("/users/1", json={"is_active": False}).status_code == 400
    assert client.patch("/users/1", json={"name": "Admin"}).status_code == 200
    assert client.get("/auth/me").json()["role"] == "ADMIN"


def test_non_admins_cannot_manage_users(client):
    login(client, "mgr1@test.com", "mgr123")
    assert client.patch("/users/4", json={"role": "ADMIN"}).status_code == 403
    assert client.post("/users", json={"name": "x", "email": "x@test.com", "password": "password1"}).status_code == 403
    login(client, "mem1@test.com", "mem123")
    assert client.get("/users").status_code == 403


def test_team_lead_sees_team_projects_but_not_others(client):
    # Admin creates a project in Team 1 whose project manager is Manager 2;
    # Manager 1 leads Team 1, so they can open it and must also be able to list it.
    login(client, "admin@test.com", "admin123")
    proj = client.post("/projects", json={"name": "Lead Visible", "team_id": 1, "manager_id": 3}).json()
    task = client.post("/tasks", json={"title": "Lead task", "project_id": proj["id"], "assigned_to": 4}).json()

    login(client, "mgr1@test.com", "mgr123")
    assert any(p["id"] == proj["id"] for p in client.get("/projects").json())
    assert any(t["id"] == task["id"] for t in client.get("/tasks").json())
    assert client.get(f"/tasks/{task['id']}").status_code == 200

    # Member 2 (Team 2 only) cannot see it by any route
    login(client, "mem2@test.com", "mem123")
    assert all(p["id"] != proj["id"] for p in client.get("/projects").json())
    assert client.get(f"/projects/{proj['id']}").status_code == 403
    assert client.get(f"/tasks/{task['id']}").status_code == 403
    assert client.get(f"/tasks?project_id={proj['id']}").status_code == 403


def test_notifications_are_private(client):
    login(client, "mgr1@test.com", "mgr123")
    proj = client.post("/projects", json={"name": "Notif", "team_id": 1}).json()
    client.post("/tasks", json={"title": "Notif task", "project_id": proj["id"], "assigned_to": 4})

    login(client, "mem1@test.com", "mem123")
    mine = client.get("/notifications").json()
    assert mine and all(n["user_id"] == 4 for n in mine)
    note_id = mine[0]["id"]
    assert client.patch(f"/notifications/{note_id}/read", json={"is_read": True}).json()["is_read"] is True
    assert next(n for n in client.get("/notifications").json() if n["id"] == note_id)["is_read"] is True

    login(client, "mem2@test.com", "mem123")
    assert all(n["id"] != note_id for n in client.get("/notifications").json())
    assert client.patch(f"/notifications/{note_id}/read", json={"is_read": False}).status_code == 403


# ---------------------------------------------------------------------------
# Data integrity
# ---------------------------------------------------------------------------

def test_delete_team_with_projects_is_rejected(client):
    login(client, "admin@test.com", "admin123")
    team = client.post("/teams", json={"name": "Has Projects", "manager_id": 2}).json()
    proj = client.post("/projects", json={"name": "Keeps team", "team_id": team["id"]}).json()

    res = client.delete(f"/teams/{team['id']}")
    assert res.status_code == 409
    assert client.get(f"/projects/{proj['id']}").status_code == 200

    client.delete(f"/projects/{proj['id']}")
    assert client.delete(f"/teams/{team['id']}").status_code == 204


def test_project_delete_removes_tasks_and_submissions(client):
    login(client, "mgr1@test.com", "mgr123")
    proj = client.post("/projects", json={"name": "Cascade", "team_id": 1}).json()
    task = client.post("/tasks", json={"title": "Cascade task", "project_id": proj["id"], "assigned_to": 4}).json()
    login(client, "mem1@test.com", "mem123")
    sub = client.post(f"/submissions/task/{task['id']}", data={"comment": "x"}).json()

    login(client, "mgr1@test.com", "mgr123")
    assert client.delete(f"/projects/{proj['id']}").status_code == 204
    assert client.get(f"/tasks/{task['id']}").status_code == 404
    assert client.get(f"/submissions/{sub['id']}").status_code == 404


def test_task_validation(client):
    login(client, "mgr1@test.com", "mgr123")
    proj = client.post("/projects", json={"name": "Validation", "team_id": 1}).json()
    assert client.post("/tasks", json={"title": "t", "project_id": proj["id"], "assigned_to": 4, "status": "BOGUS"}).status_code == 422
    assert client.post("/tasks", json={"title": "t", "project_id": proj["id"], "assigned_to": 4, "priority": "MEGA"}).status_code == 422
    assert client.post("/tasks", json={"title": "", "project_id": proj["id"], "assigned_to": 4}).status_code == 422
    assert client.post("/tasks", json={"title": "t", "project_id": 99999, "assigned_to": 4}).status_code == 404
    assert client.post("/tasks", json={"title": "t", "project_id": proj["id"], "assigned_to": 99999}).status_code == 404
    assert client.post("/tasks", json={"title": "t", "project_id": proj["id"], "assigned_to": 2}).status_code == 400
    assert client.patch("/tasks/99999", json={"title": "x"}).status_code == 404
    task = client.post("/tasks", json={
        "title": "Deadline", "project_id": proj["id"], "assigned_to": 4, "due_date": "2026-12-01", "priority": "URGENT",
    }).json()
    updated = client.patch(f"/tasks/{task['id']}", json={"due_date": "2027-01-15", "priority": "LOW"}).json()
    assert updated["due_date"] == "2027-01-15" and updated["priority"] == "LOW"


# ---------------------------------------------------------------------------
# GitHub service (HTTP mocked; no live network)
# ---------------------------------------------------------------------------

@pytest.fixture
def github_http(monkeypatch):
    """Route the service's AsyncClient through a mock handler and record requests."""
    calls = []
    real_client = httpx.AsyncClient

    def install(handler):
        def recording(request):
            calls.append(request)
            return handler(request)

        monkeypatch.setattr(
            github.httpx, "AsyncClient",
            lambda *a, **kw: real_client(*a, transport=httpx.MockTransport(recording), **kw),
        )
        return calls

    return install


def _status_of(coro):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(coro)
    return exc.value


def test_github_requests_go_only_to_api_host(github_http, monkeypatch):
    monkeypatch.setattr(github.settings, "GITHUB_TOKEN", "ghp_secret_token")
    calls = github_http(lambda r: httpx.Response(200, json={"name": "repo", "owner": {"login": "o"}}))
    info = asyncio.run(github.fetch_github_repo_info("o", "repo"))
    assert calls[0].url.host == "api.github.com"
    assert calls[0].url.path == "/repos/o/repo"
    assert "ghp_secret_token" not in str(info)


def test_github_error_mapping(github_http):
    github_http(lambda r: httpx.Response(404))
    assert _status_of(github.fetch_github_repo_info("o", "gone")).status_code == 404

    github_http(lambda r: httpx.Response(403, json={"message": "API rate limit exceeded"}))
    assert _status_of(github.fetch_github_commits("o", "r")).status_code == 503

    github_http(lambda r: httpx.Response(500))
    assert _status_of(github.fetch_github_repo_info("o", "r")).status_code == 502

    github_http(lambda r: httpx.Response(409))  # empty repository
    assert asyncio.run(github.fetch_github_commits("o", "empty")) == []

    def timeout(_):
        raise httpx.ReadTimeout("slow")
    github_http(timeout)
    assert _status_of(github.fetch_github_repo_info("o", "r")).status_code == 504

    def refused(_):
        raise httpx.ConnectError("connect to 10.0.0.5:443 refused")
    github_http(refused)
    err = _status_of(github.fetch_github_commits("o", "r"))
    assert err.status_code == 502 and "10.0.0.5" not in err.detail


def test_github_url_rejects_ssrf_shapes():
    for bad in [
        "https://github.com.evil.com/o/r",
        "https://evil.com/github.com/o/r",
        "http://127.0.0.1/o/r",
        "https://github.com/../r",
        "https://github.com/o/r/../../x",
        "file:///etc/passwd",
    ]:
        with pytest.raises(HTTPException):
            github.validate_and_parse_github_url(bad)
