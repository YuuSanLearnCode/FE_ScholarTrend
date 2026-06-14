import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function normalizePaperListItem(paper) {
  return {
    ...paper,
    year: paper.publicationYear ?? paper.year,
    journal:
      (typeof paper.journal === 'string' ? paper.journal : paper.journal?.name) ||
      'Unknown journal',
    authors: (paper.authors ?? [])
      .map((author) => (typeof author === 'string' ? author : author.name))
      .filter(Boolean),
    keywords: paper.keywords ?? [],
    citationCount: paper.citationCount ?? 0,
  }
}

function normalizePaperDetail(paper) {
  const journal = typeof paper.journal === 'string'
    ? { name: paper.journal }
    : paper.journal

  return {
    ...paper,
    year: paper.publicationYear ?? paper.year,
    journal: journal ?? null,
    journalName: journal?.name || 'Unknown journal',
    authors: (paper.authors ?? [])
      .map((author) => (
        typeof author === 'string'
          ? { id: null, name: author, affiliation: '' }
          : author
      ))
      .filter((author) => author.name),
    keywords: paper.keywords ?? [],
    topics: paper.topics ?? [],
    citationCount: paper.citationCount ?? 0,
    isBookmarked: Boolean(paper.isBookmarked),
  }
}

export async function searchPapers(params = {}) {
  let query = params.query ?? params.keyword ?? ''
  let searchType = params.searchType ?? 'All'

  if (!query && params.author) {
    query = params.author
    searchType = 'Author'
  } else if (!query && params.journal) {
    query = params.journal
    searchType = 'Journal'
  }

  const apiParams = {
    Query: query || undefined,
    SearchType: searchType && searchType !== 'All' ? searchType : undefined,
    JournalId: params.journalId,
    TopicId: params.topicId,
    YearFrom: params.yearFrom,
    YearTo: params.yearTo,
    MinCitations: params.minCitations,
    Page: params.page ?? 1,
    PageSize: params.pageSize ?? 10,
  }
  const { data: response } = await api.get('/papers/search', { params: apiParams })
  const result = unwrapResponse(response, 'Failed to search papers.')

  return {
    ...result,
    items: (result.items ?? []).map(normalizePaperListItem),
    totalCount: result.totalCount ?? 0,
    page: Number(result.page) > 0 ? result.page : apiParams.Page,
    pageSize: Number(result.pageSize) > 0 ? result.pageSize : apiParams.PageSize,
    totalPages: result.totalPages ?? 0,
  }
}

/**
 * Lấy chi tiết 1 paper
 * @param {number} id
 * @returns {Paper}
 */
export async function getPaperById(id) {
  const { data: response } = await api.get(`/papers/${id}`)
  return normalizePaperDetail(unwrapResponse(response, 'Failed to load paper details.'))
}

/**
 * Lấy papers mới nhất
 * @param {number} count
 * @returns {Paper[]}
 */
export async function getRecentPapers(count = 10) {
  const { data } = await api.get('/papers/recent', { params: { count } })
  return data
}

/**
 * Lấy papers theo tác giả
 */
export async function getPapersByAuthor(authorName, params = {}) {
  return searchPapers({
    ...params,
    query: authorName,
    searchType: 'Author',
  })
}

/**
 * Ghi nhận lượt xem paper
 */
export async function recordView(paperId) {
  const { data } = await api.post(`/papers/${paperId}/view`)
  return data
}
