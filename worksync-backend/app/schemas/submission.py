from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.submission import SubmissionStatus


class SubmissionCreate(BaseModel):
    comment: str | None = Field(None, max_length=2000)


class SubmissionReview(BaseModel):
    status: SubmissionStatus
    review_comment: str | None = Field(None, max_length=2000)


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    submitted_by: int
    file_path: str
    comment: str | None
    status: SubmissionStatus
    review_comment: str | None
    reviewed_by: int | None
    submitted_at: datetime
    reviewed_at: datetime | None