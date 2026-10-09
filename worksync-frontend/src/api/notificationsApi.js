/**
 * Notifications API — wraps /notifications/* endpoints.
 *
 * Backend response shape (NotificationResponse):
 *   { id, user_id, type, message, is_read, created_at }
 *
 * These are used in the Activity Feed and the header notification panel.
 */
import api from './axiosInstance'

/** GET /notifications — returns notifications for the current user, newest first */
export const getNotifications = () => api.get('/notifications').then(r => r.data)

/** PATCH /notifications/:id/read — mark a notification read/unread */
export const markNotificationRead = (id, is_read = true) =>
  api.patch(`/notifications/${id}/read`, { is_read }).then(r => r.data)
