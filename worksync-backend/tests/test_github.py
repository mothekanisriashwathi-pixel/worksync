import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.services.github import validate_and_parse_github_url, normalize_github_url
from conftest import login


def test_github_url_validation():
    # Valid formats
    assert validate_and_parse_github_url("https://github.com/torvalds/linux") == ("torvalds", "linux")
    assert validate_and_parse_github_url("https://github.com/facebook/react.git") == ("facebook", "react")
    assert validate_and_parse_github_url("https://www.github.com/vercel/next.js/") == ("vercel", "next.js")
    assert normalize_github_url("https://github.com/facebook/react.git/") == "https://github.com/facebook/react"

    # Invalid formats
    with pytest.raises(Exception):
        validate_and_parse_github_url("https://gitlab.com/owner/repo")

    with pytest.raises(Exception):
        validate_and_parse_github_url("https://github.com/onlyowner")

    with pytest.raises(Exception):
        validate_and_parse_github_url("https://malicious.com/github.com/owner/repo")

    with pytest.raises(Exception):
        validate_and_parse_github_url("invalid-url")


MOCK_REPO_DATA = {
    "owner": {"login": "octocat"},
    "name": "Hello-World",
    "full_name": "octocat/Hello-World",
    "description": "My first repo on GitHub!",
    "default_branch": "master",
    "language": "JavaScript",
    "stargazers_count": 2500,
    "forks_count": 1800,
    "html_url": "https://github.com/octocat/Hello-World",
}

MOCK_COMMITS_DATA = [
    {
        "sha": "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
        "commit": {
            "message": "Merge pull request #6 from octocat/patch-1",
            "author": {
                "name": "The Octocat",
                "date": "2026-10-10T12:00:00Z",
            },
        },
        "author": {
            "login": "octocat",
            "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        },
        "html_url": "https://github.com/octocat/Hello-World/commit/7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
    }
]


def test_github_link_unlink_and_permissions(client):
    # Manager 1 logs in and creates a project
    login(client, "mgr1@test.com", "mgr123")
    p_res = client.post("/projects", json={
        "name": "GitHub Test Project",
        "team_id": 1,
        "status": "PLANNING",
    })
    assert p_res.status_code == 201
    project_id = p_res.json()["id"]

    # Member 1 cannot link GitHub repo
    login(client, "mem1@test.com", "mem123")
    mem_link = client.post(f"/projects/{project_id}/github", json={
        "github_repo_url": "https://github.com/octocat/Hello-World"
    })
    assert mem_link.status_code == 403

    # Manager 2 (different team) cannot link GitHub repo
    login(client, "mgr2@test.com", "mgr123")
    m2_link = client.post(f"/projects/{project_id}/github", json={
        "github_repo_url": "https://github.com/octocat/Hello-World"
    })
    assert m2_link.status_code == 403

    # Manager 1 links repo with invalid URL
    login(client, "mgr1@test.com", "mgr123")
    bad_url_res = client.post(f"/projects/{project_id}/github", json={
        "github_repo_url": "https://bitbucket.org/owner/repo"
    })
    assert bad_url_res.status_code == 400

    # Manager 1 links valid repo (mocking external GitHub API verification)
    with patch("app.routers.project.fetch_github_repo_info", new_callable=AsyncMock) as mock_repo_info:
        mock_repo_info.return_value = {
            "owner": "octocat",
            "repo": "Hello-World",
            "name": "Hello-World",
            "full_name": "octocat/Hello-World",
            "description": "My first repo",
            "default_branch": "master",
            "language": "JavaScript",
            "stars_count": 2500,
            "forks_count": 1800,
            "html_url": "https://github.com/octocat/Hello-World",
        }
        link_res = client.post(f"/projects/{project_id}/github", json={
            "github_repo_url": "https://github.com/octocat/Hello-World"
        })
        assert link_res.status_code == 200
        assert link_res.json()["github_repo_url"] == "https://github.com/octocat/Hello-World"

    # Member 1 (in project team) views repo metadata
    login(client, "mem1@test.com", "mem123")
    with patch("app.routers.project.fetch_github_repo_info", new_callable=AsyncMock) as mock_repo_info:
        mock_repo_info.return_value = {
            "owner": "octocat",
            "repo": "Hello-World",
            "name": "Hello-World",
            "full_name": "octocat/Hello-World",
            "description": "My first repo",
            "default_branch": "master",
            "language": "JavaScript",
            "stars_count": 2500,
            "forks_count": 1800,
            "html_url": "https://github.com/octocat/Hello-World",
        }
        repo_res = client.get(f"/projects/{project_id}/github/repo")
        assert repo_res.status_code == 200
        assert repo_res.json()["full_name"] == "octocat/Hello-World"
        assert repo_res.json()["stars_count"] == 2500

    # Member 1 views recent commits
    with patch("app.routers.project.fetch_github_commits", new_callable=AsyncMock) as mock_commits:
        mock_commits.return_value = [{
            "sha": "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d",
            "short_sha": "7fd1a60",
            "message": "Initial commit",
            "author_name": "The Octocat",
            "author_date": "2026-10-10T12:00:00Z",
            "html_url": "https://github.com/octocat/Hello-World/commit/7fd1a60b",
            "avatar_url": None,
        }]
        commits_res = client.get(f"/projects/{project_id}/github/commits")
        assert commits_res.status_code == 200
        commits = commits_res.json()
        assert len(commits) == 1
        assert commits[0]["short_sha"] == "7fd1a60"
        assert commits[0]["author_name"] == "The Octocat"

    # Member 2 (not in team) cannot view repo or commits
    login(client, "mem2@test.com", "mem123")
    unauth_repo = client.get(f"/projects/{project_id}/github/repo")
    assert unauth_repo.status_code == 403
    unauth_commits = client.get(f"/projects/{project_id}/github/commits")
    assert unauth_commits.status_code == 403

    # Manager 1 unlinks repo
    login(client, "mgr1@test.com", "mgr123")
    unlink_res = client.delete(f"/projects/{project_id}/github")
    assert unlink_res.status_code == 200
    assert unlink_res.json()["github_repo_url"] is None

    # Getting repo info after unlink returns 404
    after_unlink = client.get(f"/projects/{project_id}/github/repo")
    assert after_unlink.status_code == 404
