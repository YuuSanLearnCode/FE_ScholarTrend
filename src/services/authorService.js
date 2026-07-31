import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function mapAuthor(author) {
  return {
    ...author,
    name: author.name ?? `Author ${author.id}`,
    affiliation: author.affiliation ?? '',
    country: author.country ?? '',
    paperCount: author.paperCount ?? 0,
  }
}

function normalizePagedAuthors(result) {
  const items = Array.isArray(result)
    ? result
    : Array.isArray(result?.items)
      ? result.items
      : []

  const pageSize = result?.pageSize ?? (items.length || 10)
  const totalCount = result?.totalCount ?? items.length

  return {
    items: items.map(mapAuthor),
    totalCount,
    page: result?.page ?? 1,
    pageSize,
    totalPages:
      result?.totalPages ??
      (pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1),
  }
}

export async function getAuthors({ keyword = '', page = 1, pageSize = 10 } = {}) {
  const { data: response } = await api.get('/authors', {
    params: {
      keyword: keyword.trim() || undefined,
      page,
      pageSize,
    },
  })
  const result = unwrapResponse(response, 'Failed to load authors.')
  return normalizePagedAuthors(result)
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

function normalizeAuthorDetail(author, fallbackName = '') {
  return {
    ...author,
    name: author.name ?? fallbackName,
    externalId: author.externalId ?? '',
    affiliation: author.affiliation ?? '',
    country: author.country ?? '',
    hIndex: author.hIndex ?? 0,
    totalCitations: author.totalCitations ?? 0,
    paperCount: author.paperCount ?? 0,
    recentPapers: (author.recentPapers ?? []).map(normalizeRecentPaper),
  }
}

export async function getAuthorById(id) {
  const authorId = Number(id)
  if (!Number.isInteger(authorId) || authorId <= 0) {
    throw new Error('Invalid author id.')
  }

  const { data: response } = await api.get(`/authors/${authorId}`)
  const result = unwrapResponse(response, 'Failed to load author details.')

  return normalizeAuthorDetail(result, `Author ${authorId}`)
}

export async function getAuthorByName(name) {
  const normalizedName = String(name ?? '').trim()
  if (!normalizedName) {
    throw new Error('Author name is required.')
  }

  const { data: response } = await api.get('/authors/by-name', {
    params: { name: normalizedName },
  })
  const result = unwrapResponse(response, 'Failed to load author details.')

  return normalizeAuthorDetail(result, normalizedName)
}
