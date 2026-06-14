import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

export async function getJournals() {
  const { data: response } = await api.get('/journals')
  const result = unwrapResponse(response, 'Failed to load journals.')

  return (Array.isArray(result) ? result : []).map((journal) => ({
    ...journal,
    name: journal.name ?? `Journal ${journal.id}`,
    publisher: journal.publisher ?? '',
    issn: journal.issn ?? '',
    impactFactor: journal.impactFactor ?? 0,
    paperCount: journal.paperCount ?? 0,
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

function normalizeWebsite(value) {
  if (!value) return ''

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

export async function getJournalById(id) {
  const journalId = Number(id)
  if (!Number.isInteger(journalId) || journalId <= 0) {
    throw new Error('Invalid journal id.')
  }

  const { data: response } = await api.get(`/journals/${journalId}`)
  const result = unwrapResponse(response, 'Failed to load journal details.')

  return {
    ...result,
    name: result.name ?? `Journal ${journalId}`,
    publisher: result.publisher ?? '',
    issn: result.issn ?? '',
    website: normalizeWebsite(result.website),
    impactFactor: result.impactFactor ?? 0,
    hIndex: result.hIndex ?? 0,
    paperCount: result.paperCount ?? 0,
    recentPapers: (result.recentPapers ?? []).map(normalizeRecentPaper),
    trendChart: result.trendChart ?? [],
  }
}
