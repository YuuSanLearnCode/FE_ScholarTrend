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

function getCompareFilter(filters = {}) {
  return {
    yearFrom: Number(filters.yearFrom) || 0,
    yearTo: Number(filters.yearTo) || 0,
    monthFrom: Number(filters.monthFrom) || 0,
    monthTo: Number(filters.monthTo) || 0,
    keywordId: Number(filters.keywordId) || 0,
    topicId: Number(filters.topicId) || 0,
    journalId: Number(filters.journalId) || 0,
    top: Number(filters.top) || 10,
  }
}

export async function getTrendDashboard(filters = {}) {
  const params = getTrendParams(filters)
  const { data: response } = await api.get('/Trends/dashboard', { params })
  const result = unwrapResponse(response, 'Failed to load trend dashboard.')

  return {
    topKeywords: result.topKeywords ?? [],
    topTopics: result.topTopics ?? [],
    topJournals: result.topJournals ?? [],
    publicationTrend: result.publicationTrend ?? [],
  }
}

export async function getKeywordTrends(filters = {}) {
  const { data: response } = await api.get('/Trends/keywords', {
    params: getTrendParams(filters),
  })
  const result = unwrapResponse(response, 'Failed to load keyword trends.')

  return (Array.isArray(result) ? result : []).map((series) => ({
    ...series,
    dataPoints: series.dataPoints ?? [],
  }))
}

export async function getTopKeywordTrends(filters = {}) {
  const { data: response } = await api.get('/Trends/keywords/top', {
    params: getTrendParams(filters),
  })

  const result = unwrapResponse(response, 'Failed to load top keywords.')
  return Array.isArray(result) ? result : []
}

export async function getTopicTrends(filters = {}) {
  const { data: response } = await api.get('/Trends/topics', {
    params: getTrendParams(filters),
  })
  const result = unwrapResponse(response, 'Failed to load topic trends.')

  return (Array.isArray(result) ? result : []).map((series) => ({
    ...series,
    dataPoints: series.dataPoints ?? [],
  }))
}

export async function getTopTopicTrends(filters = {}) {
  const { data: response } = await api.get('/Trends/topics/top', {
    params: getTrendParams(filters),
  })

  const result = unwrapResponse(response, 'Failed to load top topics.')
  return Array.isArray(result) ? result : []
}

/** Tổng quan: total papers, journals, users... */
export async function getJournalTrends(filters = {}) {
  const { data: response } = await api.get('/Trends/journals', {
    params: getTrendParams(filters),
  })
  const result = unwrapResponse(response, 'Failed to load journal trends.')

  return (Array.isArray(result) ? result : []).map((series) => ({
    ...series,
    dataPoints: series.dataPoints ?? [],
  }))
}

export async function getTopJournalTrends(filters = {}) {
  const { data: response } = await api.get('/Trends/journals/top', {
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

export async function compareTrends(type, ids, filters = {}) {
  const { data: response } = await api.post('/trends/compare', {
    type,
    ids: ids.map(Number),
    filter: getCompareFilter(filters),
  })
  const result = unwrapResponse(response, 'Failed to compare trends.')

  return (Array.isArray(result) ? result : []).map((series) => ({
    ...series,
    dataPoints: series.dataPoints ?? [],
  }))
}


