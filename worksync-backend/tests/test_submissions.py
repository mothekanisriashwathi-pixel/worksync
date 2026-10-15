import pytest
from conftest import TestingSessionLocal, login

import app.routers.submission as submission_router
from app.models.submission import Submission


@pytest.fixture(autouse=True)
def isolated_uploads(tmp_path, monkeypatch):
    monkeypatch.setattr(submission_router, "UPLOAD_DIR", tmp_path)
    return tmp_path


@pytest.fixture
def task_id(client):
    # Manager 1 owns a Team 1 project; Member 1 (team 1) is the assignee.
    login(client, "mgr1@test.com", "mgr123")
    project = client.post("/projects", json={"name": "Capstone", "team_id": 1}).json()
    task = client.post("/tasks", json={
        "title": "Write report",
        "project_id": project["id"],
        "assigned_to": 4,
    }).json()
    return task["id"]


def notifications_for(client, email, password):
    login(client, email, password)
    return [n["type"] for n in client.get("/notifications").json()]


def test_full_submission_review_cycle(client, task_id, isolated_uploads):
    # 1. Member submits notes + file + GitHub link
    login(client, "mem1@test.com", "mem123")
    res = client.post(
        f"/submissions/task/{task_id}",
        data={"comment": "First draft", "github_url": "https://github.com/acme/report/commit/abc123"},
        files={"file": ("../../evil report.pdf", b"%PDF-1.4 data", "application/pdf")},
    )
    assert res.status_code == 201, res.text
    v1 = res.json()
    assert v1["version"] == 1 and v1["status"] == "PENDING" and v1["has_file"]
    assert v1["original_filename"] == "evil report.pdf"
    assert "file_path" not in v1
    stored = list(isolated_uploads.iterdir())
    assert len(stored) == 1 and stored[0].suffix == ".pdf" and "evil" not in stored[0].name
    assert client.get(f"/tasks/{task_id}").json()["status"] == "IN_REVIEW"

    # Cannot submit again while awaiting review
    dup = client.post(f"/submissions/task/{task_id}", data={"comment": "again"})
    assert dup.status_code == 409

    # 2. Persisted: a fresh session reads it back
    db = TestingSessionLocal()
    assert db.get(Submission, v1["id"]).comment == "First draft"
    db.close()

    # Reviewer notified
    assert "SUBMISSION_RECEIVED" in notifications_for(client, "mgr1@test.com", "mgr123")

    # 4. Reviewer inspects + downloads file
    assert client.get(f"/submissions/{v1['id']}").status_code == 200
    dl = client.get(f"/submissions/{v1['id']}/file")
    assert dl.status_code == 200 and dl.content == b"%PDF-1.4 data"
    assert "attachment" in dl.headers["content-disposition"]
    assert any(s["id"] == v1["id"] for s in client.get("/submissions?status_filter=PENDING").json())

    # Mark in review, then request changes (comment required)
    assert client.patch(f"/submissions/{v1['id']}/review", json={"status": "IN_REVIEW"}).json()["status"] == "IN_REVIEW"
    no_comment = client.patch(f"/submissions/{v1['id']}/review", json={"status": "CHANGES_REQUESTED", "review_comment": " "})
    assert no_comment.status_code == 400
    changes = client.patch(f"/submissions/{v1['id']}/review", json={
        "status": "CHANGES_REQUESTED", "review_comment": "Add a conclusion section.",
    })
    assert changes.status_code == 200
    assert changes.json()["reviewer_name"] == "Manager One"

    # Decision is final for that revision
    flip = client.patch(f"/submissions/{v1['id']}/review", json={"status": "APPROVED"})
    assert flip.status_code == 409

    # 7. Member sees feedback and resubmits a revision (link-only)
    assert "CHANGES_REQUESTED" in notifications_for(client, "mem1@test.com", "mem123")
    assert client.get(f"/submissions/{v1['id']}").json()["review_comment"] == "Add a conclusion section."
    res2 = client.post(f"/submissions/task/{task_id}", data={"github_url": "https://github.com/acme/report"})
    assert res2.status_code == 201
    v2 = res2.json()
    assert v2["version"] == 2 and not v2["has_file"]

    assert "RESUBMISSION_RECEIVED" in notifications_for(client, "mgr1@test.com", "mgr123")

    # 5. Approve
    approved = client.patch(f"/submissions/{v2['id']}/review", json={"status": "APPROVED"})
    assert approved.status_code == 200 and approved.json()["status"] == "APPROVED"
    assert client.get(f"/tasks/{task_id}").json()["status"] == "COMPLETED"

    # 8. History keeps both revisions and the earlier feedback
    login(client, "mem1@test.com", "mem123")
    history = client.get(f"/submissions/task/{task_id}").json()
    assert [h["version"] for h in history] == [2, 1]
    assert history[1]["status"] == "CHANGES_REQUESTED"
    assert history[1]["review_comment"] == "Add a conclusion section."

    # Approved work cannot be overwritten by a new submission
    assert client.post(f"/submissions/task/{task_id}", data={"comment": "more"}).status_code == 409


def test_submission_access_control(client, task_id):
    # 3. Member of another team cannot submit or read
    login(client, "mem2@test.com", "mem123")
    assert client.post(f"/submissions/task/{task_id}", data={"comment": "hi"}).status_code == 403
    assert client.post("/submissions/task/99999", data={"comment": "hi"}).status_code == 404

    login(client, "mem1@test.com", "mem123")
    sub = client.post(f"/submissions/task/{task_id}", data={"comment": "Done"}).json()

    login(client, "mem2@test.com", "mem123")
    assert client.get(f"/submissions/{sub['id']}").status_code == 403
    assert client.get(f"/submissions/{sub['id']}/file").status_code == 403
    assert client.get(f"/submissions/task/{task_id}").status_code == 403
    assert all(s["id"] != sub["id"] for s in client.get("/submissions").json())

    # 9. Members cannot review; other team's manager cannot review or see it
    login(client, "mem1@test.com", "mem123")
    assert client.patch(f"/submissions/{sub['id']}/review", json={"status": "APPROVED"}).status_code == 403
    # Members cannot bypass review by moving the task card
    assert client.patch(f"/tasks/{task_id}", json={"status": "COMPLETED"}).status_code == 403

    login(client, "mgr2@test.com", "mgr123")
    assert client.patch(f"/submissions/{sub['id']}/review", json={"status": "APPROVED"}).status_code == 403
    assert client.get(f"/submissions/{sub['id']}").status_code == 403
    assert all(s["id"] != sub["id"] for s in client.get("/submissions").json())

    # Admin can review
    login(client, "admin@test.com", "admin123")
    assert client.patch(f"/submissions/{sub['id']}/review", json={"status": "APPROVED"}).status_code == 200


def test_submission_validation(client, task_id):
    login(client, "mem1@test.com", "mem123")
    assert client.post(f"/submissions/task/{task_id}", data={}).status_code == 400
    assert client.post(f"/submissions/task/{task_id}", data={"github_url": "https://evil.com/a/b"}).status_code == 400
    assert client.post(f"/submissions/task/{task_id}", data={"github_url": "javascript:alert(1)"}).status_code == 400
    exe = client.post(f"/submissions/task/{task_id}", files={"file": ("run.exe", b"MZ", "application/octet-stream")})
    assert exe.status_code == 400
    html = client.post(f"/submissions/task/{task_id}", files={"file": ("x.html", b"<script>", "text/html")})
    assert html.status_code == 400


def test_upload_size_limit(client, task_id, monkeypatch):
    monkeypatch.setattr(submission_router.settings, "MAX_UPLOAD_MB", 1)
    login(client, "mem1@test.com", "mem123")
    big = client.post(f"/submissions/task/{task_id}", files={"file": ("big.pdf", b"0" * (1024 * 1024 + 1), "application/pdf")})
    assert big.status_code == 413


def test_dashboard_review_counts(client, task_id):
    login(client, "mem1@test.com", "mem123")
    sub = client.post(f"/submissions/task/{task_id}", data={"comment": "for dash"}).json()

    # 10. Manager and team-lead queues include the real pending submission
    login(client, "mgr1@test.com", "mgr123")
    for view in ("manager", "team_lead"):
        reviews = client.get(f"/dashboard/summary?view={view}").json()["pending_reviews"]
        item = next(r for r in reviews if r["id"] == sub["id"])
        assert item["task_title"] == "Write report" and item["project_name"] == "Capstone"

    client.patch(f"/submissions/{sub['id']}/review", json={"status": "CHANGES_REQUESTED", "review_comment": "Needs tests"})
    reviews = client.get("/dashboard/summary?view=manager").json()["pending_reviews"]
    assert all(r["id"] != sub["id"] for r in reviews)

    login(client, "mem1@test.com", "mem123")
    metrics = {m["key"]: m["value"] for m in client.get("/dashboard/summary").json()["metrics"]}
    assert metrics["changes_requested"] >= 1
