import api from './api'
import { clearNotificationCache } from './notificationService'

function unwrapResponse(response, fallbackMessage) {
  if (!response || response.success === false || response.data == null) {
    throw new Error(response?.message || response?.errors?.[0] || fallbackMessage)
  }

  return response.data
}

// Simple in-memory cache to make navigation feel instantaneous
const cache = new Map();
const CACHE_TTL = 15000; // 15 seconds

export function clearAdminCache() {
  cache.clear();
}

async function withCache(key, fetcher, ttl = CACHE_TTL) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  if (cached && cached.promise) {
    return cached.promise;
  }

  const promise = fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  }).catch(err => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, { promise, timestamp: 0 });
  return promise;
}

function buildUserParams(filters = {}) {
  const params = {
    page: filters.page || 1,
    pageSize: filters.pageSize || 20,
  }
  const search = filters.search?.trim()

  if (search) params.Search = search
  if (filters.role && filters.role !== 'All') params.Role = filters.role
  if (filters.isActive && filters.isActive !== 'All') {
    params.IsActive = filters.isActive === 'true'
  }

  return params
}

export async function getAdminDashboard() {
  return withCache('dashboard', async () => {
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
  });
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
    clearAdminCache();
    return unwrapResponse(response, 'Failed to update admin user role.')
  }

  clearAdminCache();
  return response
}

export async function updateUserStatus(userId, isActive) {
  const { data: response } = await api.patch(`/admin/users/${userId}/status`, { isActive })

  if (response && typeof response === 'object' && 'success' in response) {
    clearAdminCache();
    return unwrapResponse(response, 'Failed to update admin user status.')
  }

  clearAdminCache();
  return response
}

export async function assessGapAnalysisQuality() {
  const { data: response } = await api.post('/admin/gap-analysis/quality/assess')

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to run gap analysis quality assessment.')
  }

  return response
}

export async function assessTopicGapAnalysisQuality(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Enter a valid topic id.')
  }

  const { data: response } = await api.post(
    `/admin/gap-analysis/quality/assess/${normalizedTopicId}`,
  )

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to run topic gap analysis quality assessment.')
  }

  return response
}

export async function extractGapAnalysis() {
  const { data: response } = await api.post('/admin/gap-analysis/extract')

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to run gap analysis extraction.')
  }

  return response
}

export async function extractTopicGapAnalysis(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Enter a valid topic id.')
  }

  const { data: response } = await api.post(
    `/admin/gap-analysis/extract/${normalizedTopicId}`,
  )

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to run topic gap analysis extraction.')
  }

  return response
}

export async function mineGapAnalysisPatterns() {
  const { data: response } = await api.post('/admin/gap-analysis/patterns/mine')

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to mine gap analysis patterns.')
  }

  return response
}

export async function mineTopicGapAnalysisPatterns(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Enter a valid topic id.')
  }

  const { data: response } = await api.post(
    `/admin/gap-analysis/patterns/mine/${normalizedTopicId}`,
  )

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to mine topic gap analysis patterns.')
  }

  return response
}

export async function generateGapAnalysisGaps() {
  const { data: response } = await api.post('/admin/gap-analysis/gaps/generate')

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to generate gap analysis gaps.')
  }

  return response
}

export async function generateTopicGapAnalysisGaps(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Enter a valid topic id.')
  }

  const { data: response } = await api.post(
    `/admin/gap-analysis/gaps/generate/${normalizedTopicId}`,
  )

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to generate topic gap analysis gaps.')
  }

  return response
}

export async function regenerateTopicGapAnalysisGaps(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Enter a valid topic id.')
  }

  const { data: response } = await api.post(
    `/admin/gap-analysis/gaps/regenerate/${normalizedTopicId}`,
  )

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to regenerate topic gap analysis gaps.')
  }

  return response
}

export async function runTopicGapAnalysisPipeline(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Enter a valid topic id.')
  }

  const { data: response } = await api.post(
    `/admin/gap-analysis/pipeline/${normalizedTopicId}`,
  )

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to run topic gap analysis pipeline.')
  }

  return response
}


export async function getSyncLogs(page = 1, pageSize = 20) {
  return withCache(`syncLogs_${page}_${pageSize}`, async () => {
    const { data: response } = await api.get('/admin/sync/logs', {
      params: { page, pageSize },
    })

    if (response && typeof response === 'object' && 'success' in response) {
      return unwrapResponse(response, 'Failed to load sync logs.')
    }

    return response
  });
}

export async function getSyncDataSources() {
  return withCache('syncDataSources', async () => {
    const { data: response } = await api.get('/admin/sync/data-sources')

    if (response && typeof response === 'object' && 'success' in response) {
      return unwrapResponse(response, 'Failed to load sync data sources.')
    }

    return response
  });
}

export async function getSyncSchedule() {
  return withCache('syncSchedule', async () => {
    const { data: response } = await api.get('/admin/sync/schedule')

    if (response && typeof response === 'object' && 'success' in response) {
      return unwrapResponse(response, 'Failed to load sync schedule.')
    }

    return response
  });
}

export async function updateSyncSchedule(payload) {
  const { data: response } = await api.put('/admin/sync/schedule', payload)

  if (response && typeof response === 'object' && 'success' in response) {
    clearAdminCache();
    return unwrapResponse(response, 'Failed to update sync schedule.')
  }

  clearAdminCache();
  return response
}

export async function getSyncScheduleHistory(page = 1, pageSize = 20) {
  return withCache(`syncScheduleHistory_${page}_${pageSize}`, async () => {
    const { data: response } = await api.get('/admin/sync/schedule/history', {
      params: { page, pageSize },
    })

    if (response && typeof response === 'object' && 'success' in response) {
      return unwrapResponse(response, 'Failed to load sync schedule history.')
    }

    return response
  });
}

export async function triggerAdminSync(payload) {
  const { data: response } = await api.post('/admin/sync/trigger', payload)

  if (response && typeof response === 'object' && 'success' in response) {
    clearAdminCache();
    return unwrapResponse(response, 'Failed to trigger sync.')
  }

  clearAdminCache();
  return response
}

export async function getSyncStatus() {
  return withCache('syncStatus', async () => {
    const { data: response } = await api.get('/admin/sync/status')

    if (response && typeof response === 'object' && 'success' in response) {
      return unwrapResponse(response, 'Failed to load sync status.')
    }

    return response
  });
}

export async function getSyncStatusBySource(sourceName) {
  const encodedSourceName = encodeURIComponent(sourceName)
  const { data: response } = await api.get(`/admin/sync/status/${encodedSourceName}`)

  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load source sync status.')
  }

  return response
}

export async function updateSyncDataSourceStatus(sourceId, isActive) {
  const { data: response } = await api.patch(`/admin/sync/data-sources/${sourceId}`, {
    isActive,
  })

  if (response && typeof response === 'object' && 'success' in response) {
    clearAdminCache();
    return unwrapResponse(response, 'Failed to update sync data source.')
  }

  clearAdminCache();
  return response
}

export async function getPendingSyncJobs(page = 1, pageSize = 20) {
  return withCache(`pendingSyncJobs_${page}_${pageSize}`, async () => {
    const { data: response } = await api.get('/admin/sync/pending', {
      params: { page, pageSize },
    })

    if (response && typeof response === 'object' && 'success' in response) {
      return unwrapResponse(response, 'Failed to load pending sync jobs.')
    }

    return response
  });
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
    clearAdminCache();
    clearNotificationCache();
    return unwrapResponse(response, 'Failed to approve pending sync papers.')
  }

  clearAdminCache();
  clearNotificationCache();
  return response
}

export async function rejectPendingSyncJob(syncId) {
  const { data: response } = await api.post(`/admin/sync/pending/${syncId}/reject`)

  if (response && typeof response === 'object' && 'success' in response) {
    clearAdminCache();
    clearNotificationCache();
    return unwrapResponse(response, 'Failed to reject pending sync.')
  }

  clearAdminCache();
  clearNotificationCache();
  return response
}

// ====================
// PDF TEXT & MIGRATION
// ====================

export async function extractPdfTextForPaper(id, force = false) {
  const { data: response } = await api.post(`/admin/pdf-text/papers/${id}/extract`, null, {
    params: { force }
  })
  return unwrapResponse(response, 'Failed to extract PDF text.')
}

export async function extractPdfTextBatch(paperIds, force = false) {
  const { data: response } = await api.post(`/admin/pdf-text/papers/extract-batch`, {
    paperIds,
    force
  })
  return unwrapResponse(response, 'Failed to batch extract PDF text.')
}

export async function backfillPdfText(maxPapers = 200) {
  const { data: response } = await api.post(`/admin/pdf-text/backfill`, null, {
    params: { maxPapers }
  })
  return unwrapResponse(response, 'Failed to backfill PDF text.')
}

export async function getExtractedPdfText(id) {
  const { data: response } = await api.get(`/admin/pdf-text/papers/${id}`)
  return unwrapResponse(response, 'Failed to get extracted PDF text.')
}

export async function migratePdfsToB2() {
  const { data: response } = await api.post(`/admin/migrations/pdfs/local-to-b2`)
  return unwrapResponse(response, 'Failed to migrate PDFs to B2.')
}

export async function getPdfStorageList(limit = 50) {
  const { data: response } = await api.get(`/admin/migrations/pdfs`, {
    params: { limit }
  })
  return unwrapResponse(response, 'Failed to get PDF storage list.')
}

// ====================
// AI TESTING (GAP ANALYSIS)
// ====================

export async function extractPaperWithAI(paperId) {
  const normalizedPaperId = Number(paperId)
  if (!Number.isInteger(normalizedPaperId) || normalizedPaperId <= 0) {
    throw new Error('Invalid paper id.')
  }

  const { data: response } = await api.post(`/admin/gap-analysis/extract-paper/${normalizedPaperId}`)
  return unwrapResponse(response, 'Failed to extract paper data using AI.')
}

export async function testAIGapAnalysis() {
  const { data: response } = await api.get(`/admin/gap-analysis/test-ai`)
  return unwrapResponse(response, 'Failed to test AI connection.')
}

export async function retryFailedDownloads() {
  const { data: response } = await api.post('/admin/pdf-text/retry-failed-downloads')
  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to retry failed downloads.')
  }
  return response
}
