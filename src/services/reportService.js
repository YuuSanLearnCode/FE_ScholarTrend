import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

export async function getPublicationReport(filters = {}) {
  const { data: response } = await api.get('/reports/publications', {
    params: {
      YearFrom: filters.yearFrom || undefined,
      YearTo: filters.yearTo || undefined,
      GroupBy: filters.groupBy?.trim() || undefined,
    },
  })
  const result = unwrapResponse(response, 'Failed to load publication report.')

  return {
    groupBy: result.groupBy ?? filters.groupBy ?? '',
    yearFrom: result.yearFrom ?? (Number(filters.yearFrom) || 0),
    yearTo: result.yearTo ?? (Number(filters.yearTo) || 0),
    totalPapers: result.totalPapers ?? 0,
    items: (Array.isArray(result.items) ? result.items : []).map((item) => ({
      key: item.key ?? 'Unknown',
      paperCount: item.paperCount ?? 0,
      totalCitations: item.totalCitations ?? 0,
    })),
    generatedAt: result.generatedAt ?? null,
  }
}
