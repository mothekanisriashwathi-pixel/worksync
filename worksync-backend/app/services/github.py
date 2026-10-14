import re
from urllib.parse import urlparse
import httpx
from fastapi import HTTPException, status

from app.core.config import settings

# Strict regex matching valid GitHub public repositories:
# e.g., https://github.com/owner/repo or https://www.github.com/owner/repo (with optional .git and trailing slash)
GITHUB_URL_PATTERN = re.compile(
    r"^https?://(?:www\.)?github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+?)(?:\.git)?/?$"
)


def validate_and_parse_github_url(url: str) -> tuple[str, str]:
    """
    Validate that a given string is a valid GitHub repository URL and
    extract the owner and repo name.

    SSRF Protection:
    Ensures host is strictly github.com and owner/repo contain only alphanumeric
    and safe characters without path traversal characters.
    """
    if not url or not isinstance(url, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub repository URL must be provided as a string.",
        )

    clean_url = url.strip()
    match = GITHUB_URL_PATTERN.match(clean_url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub repository URL. Must be in format: https://github.com/owner/repository",
        )

    owner, repo = match.group(1), match.group(2)

    # Prevent path traversal or reserved names
    if owner in (".", "..") or repo in (".", ".."):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid repository owner or name.",
        )

    return owner, repo


def normalize_github_url(url: str) -> str:
    """
    Normalize GitHub repository URL to standard canonical format:
    https://github.com/{owner}/{repo}
    """
    owner, repo = validate_and_parse_github_url(url)
    return f"https://github.{'com'}/{owner}/{repo}"


def _get_headers() -> dict[str, str]:
    """Build standard headers for GitHub API requests."""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "WorkSync-App",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


async def fetch_github_repo_info(owner: str, repo: str) -> dict:
    """
    Fetch repository information from official GitHub REST API:
    GET https://api.github.com/repos/{owner}/{repo}
    """
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(api_url, headers=headers)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="GitHub API request timed out.",
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to GitHub API: {str(exc)}",
        )

    if resp.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub repository not found or is private.",
        )
    elif resp.status_code in (403, 429):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub API rate limit exceeded or access forbidden. Please try again later.",
        )
    elif resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API returned unexpected status code {resp.status_code}.",
        )

    data = resp.json()
    return {
        "owner": data.get("owner", {}).get("login", owner),
        "repo": data.get("name", repo),
        "name": data.get("name", repo),
        "full_name": data.get("full_name", f"{owner}/{repo}"),
        "description": data.get("description"),
        "default_branch": data.get("default_branch", "main"),
        "language": data.get("language"),
        "stars_count": data.get("stargazers_count", 0),
        "forks_count": data.get("forks_count", 0),
        "html_url": data.get("html_url", f"https://github.com/{owner}/{repo}"),
    }


async def fetch_github_commits(owner: str, repo: str, per_page: int = 10) -> list[dict]:
    """
    Fetch recent commit activity from official GitHub REST API:
    GET https://api.github.com/repos/{owner}/{repo}/commits
    """
    api_url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    headers = _get_headers()
    params = {"per_page": min(max(per_page, 1), 30)}

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(api_url, headers=headers, params=params)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="GitHub API request timed out.",
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to GitHub API: {str(exc)}",
        )

    if resp.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub repository or branch not found.",
        )
    elif resp.status_code == 409:
        # Empty repository (no commits yet)
        return []
    elif resp.status_code in (403, 429):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub API rate limit exceeded. Please try again later.",
        )
    elif resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API returned unexpected status code {resp.status_code}.",
        )

    raw_commits = resp.json()
    if not isinstance(raw_commits, list):
        return []

    commits = []
    for item in raw_commits:
        sha = item.get("sha", "")
        commit_data = item.get("commit", {})
        author_data = commit_data.get("author", {}) or {}
        github_author = item.get("author") or {}

        commits.append({
            "sha": sha,
            "short_sha": sha[:7] if sha else "",
            "message": commit_data.get("message", "").strip(),
            "author_name": author_data.get("name") or github_author.get("login") or "Unknown",
            "author_date": author_data.get("date") or "",
            "html_url": item.get("html_url", f"https://github.com/{owner}/{repo}/commit/{sha}"),
            "avatar_url": github_author.get("avatar_url"),
        })

    return commits
