import pytest
from conftest import login



def test_auth_me_with_cookie(client):
    login(client, "admin@test.com", "admin123")
    res = client.get("/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "admin@test.com"
    assert res.json()["role"] == "ADMIN"


def test_auth_logout(client):
    login(client, "admin@test.com", "admin123")
    client.post("/auth/logout")
    res = client.get("/auth/me")
    assert res.status_code == 401


def test_project_crud_and_permissions(client):
    # Manager 1 logs in
    login(client, "mgr1@test.com", "mgr123")

    # Manager 1 creates a project in Team 1
    create_res = client.post("/projects", json={
        "name": "Project Apollo",
        "description": "Apollo mission",
        "team_id": 1,
        "status": "PLANNING"
    })
    assert create_res.status_code == 201
    project_id = create_res.json()["id"]
    assert create_res.json()["name"] == "Project Apollo"
    assert create_res.json()["manager_id"] == 2

    # Manager 1 cannot create project for Team 2 (managed by Manager 2)
    bad_res = client.post("/projects", json={
        "name": "Invalid Project",
        "team_id": 2,
    })
    assert bad_res.status_code == 403

    # Manager 1 gets project details
    detail_res = client.get(f"/projects/{project_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == project_id

    # Manager 1 updates project
    patch_res = client.patch(f"/projects/{project_id}", json={
        "status": "IN_PROGRESS",
        "description": "Apollo mission in progress"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "IN_PROGRESS"

    # Member 1 (in Team 1) can view the project
    login(client, "mem1@test.com", "mem123")
    mem_res = client.get(f"/projects/{project_id}")
    assert mem_res.status_code == 200

    # Member 1 cannot update project
    mem_patch = client.patch(f"/projects/{project_id}", json={"name": "Hacked"})
    assert mem_patch.status_code == 403

    # Member 2 (not in Team 1) cannot view project
    login(client, "mem2@test.com", "mem123")
    unauth_res = client.get(f"/projects/{project_id}")
    assert unauth_res.status_code == 403

    # Manager 1 deletes the project at the end
    login(client, "mgr1@test.com", "mgr123")
    del_res = client.delete(f"/projects/{project_id}")
    assert del_res.status_code == 204

    # Verifying deleted
    check_del = client.get(f"/projects/{project_id}")
    assert check_del.status_code == 404


def test_task_crud_and_permissions(client):
    # Setup project for task testing
    login(client, "mgr1@test.com", "mgr123")
    p_res = client.post("/projects", json={
        "name": "Project Artemis",
        "team_id": 1,
        "status": "IN_PROGRESS"
    })
    project_id = p_res.json()["id"]

    # Manager creates task assigned to Member 1 (in Team 1)
    task_res = client.post("/tasks", json={
        "title": "Build Booster",
        "description": "Assemble first stage",
        "project_id": project_id,
        "assigned_to": 4, # Member 1
        "priority": "HIGH",
        "status": "TODO"
    })
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]
    assert task_res.json()["title"] == "Build Booster"

    # Cannot assign to Member 2 (not in project team)
    bad_assign = client.post("/tasks", json={
        "title": "Invalid Task",
        "project_id": project_id,
        "assigned_to": 5, # Member 2
    })
    assert bad_assign.status_code == 400

    # Manager 2 cannot access this task
    login(client, "mgr2@test.com", "mgr123")
    m2_res = client.get(f"/tasks/{task_id}")
    assert m2_res.status_code == 403

    # Member 1 can view the task and update status to IN_PROGRESS
    login(client, "mem1@test.com", "mem123")
    m1_res = client.get(f"/tasks/{task_id}")
    assert m1_res.status_code == 200

    m1_patch = client.patch(f"/tasks/{task_id}", json={"status": "IN_PROGRESS"})
    assert m1_patch.status_code == 200
    assert m1_patch.json()["status"] == "IN_PROGRESS"

    # Member 1 cannot reassign task to someone else
    m1_bad_patch = client.patch(f"/tasks/{task_id}", json={"assigned_to": 5})
    assert m1_bad_patch.status_code == 403

    # Member 1 cannot delete task
    m1_del = client.delete(f"/tasks/{task_id}")
    assert m1_del.status_code == 403

    # Manager deletes task
    login(client, "mgr1@test.com", "mgr123")
    del_task_res = client.delete(f"/tasks/{task_id}")
    assert del_task_res.status_code == 204

    # Verify task deleted
    check_task = client.get(f"/tasks/{task_id}")
    assert check_task.status_code == 404


def test_teams_and_members_management(client):
    # Manager 1 views Team 1 members
    login(client, "mgr1@test.com", "mgr123")
    res = client.get("/teams/1/members")
    assert res.status_code == 200
    members = res.json()
    assert len(members) >= 1
    assert any(m["user_id"] == 4 for m in members)
    # Check enriched user response
    mem4 = next(m for m in members if m["user_id"] == 4)
    assert mem4["user"]["name"] == "Member One"

    # Manager 1 cannot view Team 2 members
    bad_team_res = client.get("/teams/2/members")
    assert bad_team_res.status_code == 403

    # Admin adds Member 2 to Team 1
    login(client, "admin@test.com", "admin123")
    add_mem_res = client.post("/teams/1/members", json={"user_id": 5})
    assert add_mem_res.status_code == 201

    # Remove Member 2 from Team 1
    del_mem_res = client.delete("/teams/1/members/5")
    assert del_mem_res.status_code == 204


def test_unauthenticated_requests_blocked(client):
    # Logging out or without cookie
    client.post("/auth/logout")
    assert client.get("/projects").status_code == 401
    assert client.get("/tasks").status_code == 401
    assert client.get("/teams").status_code == 401
    assert client.post("/projects", json={"name": "test"}).status_code == 401

