import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

/** Lấy danh sách notifications */
export async function getNotifications({ isRead, limit = 20 } = {}) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const { data: response } = await api.get('/notifications', {
    params: {
      isRead: typeof isRead === 'boolean' ? isRead : undefined,
      limit: normalizedLimit,
    },
  })
  const result = unwrapResponse(response, 'Failed to load notifications.')

  return (Array.isArray(result) ? result : []).map((item) => ({
    ...item,
    title: item.title ?? 'Notification',
    message: item.message ?? '',
    targetUrl: item.targetUrl ?? '',
    isRead: Boolean(item.isRead ?? item.read),
    read: Boolean(item.isRead ?? item.read),
    createdAt: item.createdAt ?? null,
    readAt: item.readAt ?? null,
  }))
}

/** Đánh dấu 1 notification đã đọc */
export async function getUnreadNotificationCount() {
  const { data: response } = await api.get('/notifications/unread-count')
  const result = unwrapResponse(response, 'Failed to load unread notification count.')
  const count = Number(result)

  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

export async function getNotificationSettings() {
  const { data: response } = await api.get('/notifications/settings')
  const result = unwrapResponse(response, 'Failed to load notification settings.')

  return {
    emailEnabled: Boolean(result.emailEnabled),
    topicAlertEnabled: Boolean(result.topicAlertEnabled),
    frequency: result.frequency ?? 'Not set',
  }
}

export async function updateNotificationSettings(settings) {
  const frequency = String(settings.frequency ?? '').trim()
  if (!frequency) {
    throw new Error('Notification frequency is required.')
  }

  const { data: response } = await api.put('/notifications/settings', {
    emailEnabled: Boolean(settings.emailEnabled),
    topicAlertEnabled: Boolean(settings.topicAlertEnabled),
    frequency,
  })
  const result = unwrapResponse(response, 'Failed to update notification settings.')

  return {
    emailEnabled: Boolean(result.emailEnabled),
    topicAlertEnabled: Boolean(result.topicAlertEnabled),
    frequency: result.frequency ?? frequency,
  }
}

export async function markAsRead(notificationId) {
  const normalizedId = Number(notificationId)
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error('Invalid notification id.')
  }

  const { data: response } = await api.patch(`/notifications/${normalizedId}/read`)
  return unwrapResponse(response, 'Failed to mark notification as read.')
}

/** Đánh dấu tất cả đã đọc */
export async function markAllAsRead() {
  const { data: response } = await api.patch('/notifications/read-all')
  return unwrapResponse(response, 'Failed to mark all notifications as read.')
}
