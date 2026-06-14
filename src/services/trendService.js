import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function getTrendParams(filters = {}) {
  return {
    YearFrom: filters.yearFrom || undefined,
    YearTo: filters.yearTo || undefined,
    MonthFrom: filters.monthFrom || undefined,
    MonthTo: filters.monthTo || undefined,
    KeywordId: filters.keywordId || undefined,
    TopicId: filters.topicId || undefined,
    JournalId: filters.journalId || undefined,
    Top: filters.top || 10,
  }
}

export async function getTrendDashboard(filters = {}) {
  const params = getTrendParams(filters)
  const { data: response } = await api.get('/trends/dashboard', { params })
  const result = unwrapResponse(response, 'Failed to load trend dashboard.')

  return {
    topKeywords: result.topKeywords ?? [],
    topTopics: result.topTopics ?? [],
    topJournals: result.topJournals ?? [],
    publicationTrend: result.publicationTrend ?? [],
  }
}

export async function getKeywordTrends(filters = {}) {
  const { data: response } = await api.get('/trends/keywords', {
    params: getTrendParams(filters),
  })
  const result = unwrapResponse(response, 'Failed to load keyword trends.')

  return (Array.isArray(result) ? result : []).map((series) => ({
    ...series,
    dataPoints: series.dataPoints ?? [],
  }))
}

export async function getTopKeywordTrends(filters = {}) {
  const { data: response } = await api.get('/trends/keywords/top', {
    params: getTrendParams(filters),
  })

  const result = unwrapResponse(response, 'Failed to load top keywords.')
  return Array.isArray(result) ? result : []
}

export async function getTopicTrends(filters = {}) {
  const { data: response } = await api.get('/trends/topics', {
    params: getTrendParams(filters),
  })
  const result = unwrapResponse(response, 'Failed to load topic trends.')

  return (Array.isArray(result) ? result : []).map((series) => ({
    ...series,
    dataPoints: series.dataPoints ?? [],
  }))
}

export async function getTopTopicTrends(filters = {}) {
  const { data: response } = await api.get('/trends/topics/top', {
    params: getTrendParams(filters),
  })

  const result = unwrapResponse(response, 'Failed to load top topics.')
  return Array.isArray(result) ? result : []
}

/** Tổng quan: total papers, journals, users... */
export async function getJournalTrends(filters = {}) {
  const { data: response } = await api.get('/trends/journals', {
    params: getTrendParams(filters),
  })
  const result = unwrapResponse(response, 'Failed to load journal trends.')

  return (Array.isArray(result) ? result : []).map((series) => ({
    ...series,
    dataPoints: series.dataPoints ?? [],
  }))
}

export async function getTopJournalTrends(filters = {}) {
  const { data: response } = await api.get('/trends/journals/top', {
    params: getTrendParams(filters),
  })

  const result = unwrapResponse(response, 'Failed to load top journals.')
  return Array.isArray(result) ? result : []
}

export async function getPublicationTrends(filters = {}) {
  const { data: response } = await api.get('/trends/publications', {
    params: getTrendParams(filters),
  })

  const result = unwrapResponse(response, 'Failed to load publication trends.')
  return Array.isArray(result) ? result : []
}

export async function getTrendOverview() {
  const { data } = await api.get('/trends/overview')
  return data
}

/** Số lượng paper theo năm (cho biểu đồ) */
export async function getTrendByYear(params = {}) {
  const { data } = await api.get('/trends/by-year', { params })
  return data
}
