import pytest
from conftest import login


def test_dashboard_unauthenticated(client):
    res = client.get("/dashboard/summary")
    assert res.status_code == 401


def test_member_dashboard(client):
    login(client, "mem1@test.com", "mem123")
    res = client.get("/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "MEMBER"
    assert data["active_view"] == "member"
    assert data["allowed_views"] == ["member"]
    assert len(data["metrics"]) == 4

    # Member cannot access admin dashboard
    forbidden_admin = client.get("/dashboard/summary?view=admin")
    assert forbidden_admin.status_code == 403

    # Member cannot access manager dashboard
    forbidden_mgr = client.get("/dashboard/summary?view=manager")
    assert forbidden_mgr.status_code == 403

    # Member cannot access team lead dashboard
    forbidden_lead = client.get("/dashboard/summary?view=team_lead")
    assert forbidden_lead.status_code == 403


def test_manager_dashboard_and_views(client):
    login(client, "mgr1@test.com", "mgr123")
    res = client.get("/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "MANAGER"
    assert data["active_view"] == "manager"
    assert "manager" in data["allowed_views"]
    assert "team_lead" in data["allowed_views"]
    assert "member" in data["allowed_views"]

    # Manager can access team_lead view
    lead_res = client.get("/dashboard/summary?view=team_lead")
    assert lead_res.status_code == 200
    assert lead_res.json()["active_view"] == "team_lead"

    # Manager can access member view
    mem_res = client.get("/dashboard/summary?view=member")
    assert mem_res.status_code == 200
    assert mem_res.json()["active_view"] == "member"

    # Manager cannot access admin view
    admin_res = client.get("/dashboard/summary?view=admin")
    assert admin_res.status_code == 403


def test_admin_dashboard_and_all_views(client):
    login(client, "admin@test.com", "admin123")
    res = client.get("/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "ADMIN"
    assert data["active_view"] == "admin"
    assert data["platform_overview"] is not None
    assert "total_users" in data["platform_overview"]
    assert "user_distribution" in data["platform_overview"]

    # Admin can inspect all other views
    for v in ["manager", "team_lead", "member"]:
        sub_res = client.get(f"/dashboard/summary?view={v}")
        assert sub_res.status_code == 200
        assert sub_res.json()["active_view"] == v
