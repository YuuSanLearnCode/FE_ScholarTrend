import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response || response.success === false || response.data == null) {
    throw new Error(response?.message || response?.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function buildUserParams(filters = {}) {
  const params = {}
  const search = filters.search?.trim()

  if (search) params.Search = search
  if (filters.role && filters.role !== 'All') params.Role = filters.role
  if (filters.isActive && filters.isActive !== 'All') {
    params.IsActive = filters.isActive === 'true'
  }

  return params
}

export async function getAdminDashboard() {
  const { data: response } = await api.get('/admin/dashboard')
  const result = unwrapResponse(response, 'Failed to load admin dashboard.')

  return {
    ...result,
    totalUsers: result.totalUsers ?? 0,
    activeUsers: result.activeUsers ?? 0,
    totalPapers: result.totalPapers ?? 0,
    totalKeywords: result.totalKeywords ?? 0,
    totalTopics: result.totalTopics ?? 0,
    totalJournals: result.totalJournals ?? 0,
    totalBookmarks: result.totalBookmarks ?? 0,
    totalFollows: result.totalFollows ?? 0,
    usersByRole: result.usersByRole ?? {},
    lastSync: result.lastSync ?? null,
    recentSyncLogs: result.recentSyncLogs ?? [],
    dataSources: result.dataSources ?? [],
    publicationTrend: result.publicationTrend ?? [],
    topKeywords: result.topKeywords ?? [],
  }
}

export async function getUsers(filters = {}) {
  const { data: response } = await api.get('/admin/users', {
    params: buildUserParams(filters),
  })

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load admin users.')
  }

  return response
}

export async function getUserById(userId) {
  const { data: response } = await api.get(`/admin/users/${userId}`)

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load admin user detail.')
  }

  return response
}

export async function updateUserRole(userId, role) {
  const { data: response } = await api.patch(`/admin/users/${userId}/role`, { role })

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to update admin user role.')
  }

  return response
}

export async function updateUserStatus(userId, isActive) {
  const { data: response } = await api.patch(`/admin/users/${userId}/status`, { isActive })

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to update admin user status.')
  }

  return response
}

export async function deleteUser(userId) {
  await api.delete(`/admin/users/${userId}`)
}

export async function getAdminStats() {
  const { data } = await api.get('/admin/stats')
  return data
}

export async function getSyncLogs(limit = 50) {
  const { data: response } = await api.get('/admin/sync/logs', {
    params: { limit },
  })

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load sync logs.')
  }

  return response
}

export async function getSyncDataSources() {
  const { data: response } = await api.get('/admin/sync/data-sources')

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load sync data sources.')
  }

  return response
}

export async function getSyncSchedule() {
  const { data: response } = await api.get('/admin/sync/schedule')

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load sync schedule.')
  }

  return response
}

export async function updateSyncDataSourceStatus(sourceId, isActive) {
  const { data: response } = await api.patch(`/admin/sync/data-sources/${sourceId}`, {
    isActive,
  })

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to update sync data source.')
  }

  return response
}

export async function getPendingSyncJobs(limit = 50) {
  const { data: response } = await api.get('/admin/sync/pending', {
    params: { limit },
  })

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load pending sync jobs.')
  }

  return response
}

export async function getPendingSyncJobById(syncId) {
  const { data: response } = await api.get(`/admin/sync/pending/${syncId}`)

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load pending sync detail.')
  }

  return response
}

export async function approvePendingSyncPapers(syncId, pendingPaperIds) {
  const { data: response } = await api.post(`/admin/sync/pending/${syncId}/approve`, {
    pendingPaperIds,
  })

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to approve pending sync papers.')
  }

  return response
}

export async function rejectPendingSyncJob(syncId) {
  const { data: response } = await api.post(`/admin/sync/pending/${syncId}/reject`)

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to reject pending sync.')
  }

  return response
}
