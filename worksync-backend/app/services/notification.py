from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    message: str,
):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        message=message,
        is_read=False,
    )

    db.add(notification)

    return notification