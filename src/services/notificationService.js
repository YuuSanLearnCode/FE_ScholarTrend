import api from './api'

/** Lấy danh sách notifications */
export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return data
}

/** Đánh dấu 1 notification đã đọc */
export async function markAsRead(notificationId) {
  await api.patch(`/notifications/${notificationId}/read`)
}

/** Đánh dấu tất cả đã đọc */
export async function markAllAsRead() {
  await api.patch('/notifications/read-all')
}
