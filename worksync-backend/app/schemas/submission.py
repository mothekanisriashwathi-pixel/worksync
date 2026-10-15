from datetime import datetime

from pydantic import BaseModel, Field

from app.models.submission import SubmissionStatus


class SubmissionReview(BaseModel):
    status: SubmissionStatus
    review_comment: str | None = Field(None, max_length=2000)


class SubmissionResponse(BaseModel):
    id: int
    task_id: int
    task_title: str
    project_id: int
    project_name: str
    submitted_by: int
    submitter_name: str
    version: int
    comment: str | None
    github_url: str | None
    has_file: bool
    original_filename: str | None
    status: SubmissionStatus
    review_comment: str | None
    reviewed_by: int | None
    reviewer_name: str | None
    submitted_at: datetime
    reviewed_at: datetime | None
