import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function normalizeTopicId(id) {
  const topicId = Number(id)
  if (!Number.isInteger(topicId) || topicId <= 0) {
    throw new Error('Invalid topic id.')
  }

  return topicId
}

function normalizeGapId(id) {
  const gapId = Number(id)
  if (!Number.isInteger(gapId) || gapId <= 0) {
    throw new Error('Invalid gap id.')
  }

  return gapId
}

export async function getTopics() {
  const { data: response } = await api.get('/topics')
  const result = unwrapResponse(response, 'Failed to load topics.')

  return (Array.isArray(result) ? result : []).map((topic) => ({
    ...topic,
    name: topic.topicName ?? topic.name ?? `Topic ${topic.id}`,
    paperCount: topic.paperCount ?? 0,
  }))
}

function normalizeRecentPaper(paper) {
  const journal = typeof paper.journal === 'string'
    ? { name: paper.journal }
    : paper.journal

  return {
    ...paper,
    year: paper.publicationYear ?? paper.year,
    journal: journal?.name || 'Unknown journal',
    journalId: journal?.id ?? null,
    authors: (paper.authors ?? [])
      .map((author) => (typeof author === 'string' ? author : author.name))
      .filter(Boolean),
    keywords: paper.keywords ?? [],
    citationCount: paper.citationCount ?? 0,
  }
}

export async function getTopicById(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}`)
  const result = unwrapResponse(response, 'Failed to load topic details.')

  return {
    ...result,
    name: result.topicName ?? result.name ?? `Topic ${topicId}`,
    description: result.description ?? '',
    paperCount: result.paperCount ?? 0,
    recentPapers: (result.recentPapers ?? []).map(normalizeRecentPaper),
    trendChart: result.trendChart ?? [],
  }
}

export async function getTopicInsightsDashboard(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/insights/dashboard`)
  const result = unwrapResponse(response, 'Failed to load topic insights.')

  return {
    ...result,
    topicId: result.topicId ?? topicId,
    topicName: result.topicName ?? `Topic ${topicId}`,
    timeline: Array.isArray(result.timeline) ? result.timeline : [],
    opportunities: Array.isArray(result.opportunities) ? result.opportunities : [],
    topMethods: Array.isArray(result.topMethods) ? result.topMethods : [],
    topDatasets: Array.isArray(result.topDatasets) ? result.topDatasets : [],
    lastAnalyzedAt: result.lastAnalyzedAt ?? null,
  }
}

function normalizeTopicGap(gap = {}) {
  return {
    ...gap,
    id: gap.id ?? 0,
    title: gap.title ?? 'Untitled gap',
    description: gap.description ?? '',
    gapType: gap.gapType ?? 'Gap',
    suggestedDirection: gap.suggestedDirection ?? '',
    evidenceCount: gap.evidenceCount ?? gap.evidences?.length ?? 0,
    confidence: gap.confidence ?? 0,
    confidenceLevel: gap.confidenceLevel ?? 'Unknown',
    evidences: Array.isArray(gap.evidences) ? gap.evidences.map(normalizeTopicGapEvidence) : [],
    supportingPaperIds: Array.isArray(gap.supportingPaperIds) ? gap.supportingPaperIds : [],
    supportingPatterns: gap.supportingPatterns ?? null,
    topRelatedPapers: Array.isArray(gap.topRelatedPapers) ? gap.topRelatedPapers : [],
    trendInfo: gap.trendInfo ?? null,
  }
}

function normalizeTopicGapEvidence(evidence = {}) {
  return {
    ...evidence,
    id: evidence.id ?? 0,
    paperId: evidence.paperId ?? 0,
    paperTitle: evidence.paperTitle ?? `Paper #${evidence.paperId ?? 0}`,
    authors: evidence.authors ?? '',
    year: evidence.year ?? null,
    evidenceSentence: evidence.evidenceSentence ?? '',
    evidenceType: evidence.evidenceType ?? '',
    sectionSource: evidence.sectionSource ?? '',
    confidence: evidence.confidence ?? 0,
  }
}

export async function getTopicGaps(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/gaps`)
  const result = unwrapResponse(response, 'Failed to load topic gaps.')

  return {
    ...result,
    topicId: result.topicId ?? topicId,
    topicName: result.topicName ?? `Topic ${topicId}`,
    gaps: Array.isArray(result.gaps) ? result.gaps.map(normalizeTopicGap) : [],
    coverage: result.coverage ?? null,
    patterns: {
      ...(result.patterns ?? {}),
      methods: Array.isArray(result.patterns?.methods) ? result.patterns.methods : [],
      datasets: Array.isArray(result.patterns?.datasets) ? result.patterns.datasets : [],
      limitations: Array.isArray(result.patterns?.limitations) ? result.patterns.limitations : [],
    },
    timeline: {
      ...(result.timeline ?? {}),
      timeline: Array.isArray(result.timeline?.timeline) ? result.timeline.timeline : [],
    },
    generatedAt: result.generatedAt ?? null,
  }
}

export async function getTopicGapList(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/gaps/list`)
  const result = unwrapResponse(response, 'Failed to load topic gap list.')

  return (Array.isArray(result) ? result : []).map(normalizeTopicGap)
}

export async function getTopicGapById(id) {
  const gapId = normalizeGapId(id)

  const { data: response } = await api.get(`/topics/gaps/${gapId}`)
  const result = unwrapResponse(response, 'Failed to load topic gap details.')

  return normalizeTopicGap(result)
}

export async function getTopicGapEvidences(id) {
  const gapId = normalizeGapId(id)

  const { data: response } = await api.get(`/topics/gaps/${gapId}/evidences`)
  const result = unwrapResponse(response, 'Failed to load topic gap evidences.')

  return (Array.isArray(result) ? result : []).map(normalizeTopicGapEvidence)
}

export async function getTopicPatterns(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/patterns`)
  return unwrapResponse(response, 'Failed to load topic patterns.')
}

export async function getTopicGapTrends(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/trends`)
  return unwrapResponse(response, 'Failed to load topic trends.')
}

export async function getTopicCoverage(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/coverage`)
  return unwrapResponse(response, 'Failed to load topic coverage.')
}

export async function getTopicQuality(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/quality`)
  return unwrapResponse(response, 'Failed to load topic quality report.')
}

export async function getTopicAnalysis(id) {
  const topicId = normalizeTopicId(id)

  const { data: response } = await api.get(`/topics/${topicId}/analysis`)
  return unwrapResponse(response, 'Failed to load topic analysis result.')
}
