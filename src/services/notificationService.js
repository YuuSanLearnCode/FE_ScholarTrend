import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function getNotificationPaperId(item) {
  const directPaperId =
    item.paperId ??
    item.paperID ??
    item.PaperId ??
    item.relatedPaperId ??
    item.newPaperId ??
    item.paper?.id ??
    item.paper?.paperId ??
    item.data?.paperId ??
    item.metadata?.paperId ??
    item.payload?.paperId

  if (directPaperId != null && String(directPaperId).trim()) {
    return String(directPaperId).trim()
  }

  const type = String(
    item.type ?? item.notificationType ?? item.entityType ?? item.targetType ?? '',
  ).toLowerCase()

  if (!type.includes('paper') && !type.includes('article') && !type.includes('research')) {
    return ''
  }

  const typedPaperId =
    item.entityId ??
    item.targetId ??
    item.relatedId ??
    item.resourceId ??
    item.data?.entityId ??
    item.metadata?.entityId

  return typedPaperId != null && String(typedPaperId).trim()
    ? String(typedPaperId).trim()
    : ''
}

function getNotificationTargetUrl(item) {
  const explicitUrl = item.targetUrl ?? item.url ?? item.link
  if (explicitUrl != null && String(explicitUrl).trim()) {
    return String(explicitUrl).trim()
  }

  const paperId = getNotificationPaperId(item)
  return paperId ? `/papers/${encodeURIComponent(paperId)}` : ''
}

/** Lấy danh sách notifications */
export async function getNotifications({ isRead, limit = 20, type } = {}) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const { data: response } = await api.get('/notifications', {
    params: {
      isRead: typeof isRead === 'boolean' ? isRead : undefined,
      limit: normalizedLimit,
      type: type || undefined,
    },
  })
  const result = unwrapResponse(response, 'Failed to load notifications.')

  return (Array.isArray(result) ? result : []).map((item) => ({
    ...item,
    title: item.title ?? 'Notification',
    message: item.message ?? '',
    targetUrl: getNotificationTargetUrl(item),
    paperId: getNotificationPaperId(item) || null,
    isRead: Boolean(item.isRead ?? item.read),
    read: Boolean(item.isRead ?? item.read),
    createdAt: item.createdAt ?? null,
    readAt: item.readAt ?? null,
  }))
}

/** Đánh dấu 1 notification đã đọc */
export async function getUnreadNotificationCount(type) {
  const { data: response } = await api.get('/notifications/unread-count', {
    params: { type: type || undefined }
  })
  const result = unwrapResponse(response, 'Failed to load unread notification count.')
  const rawCount = typeof result === 'object' && result !== null
    ? result.unreadCount ?? result.count ?? result.totalUnread ?? result.unreadNotifications ?? result.totalCount
    : result
  const count = Number(rawCount)

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
