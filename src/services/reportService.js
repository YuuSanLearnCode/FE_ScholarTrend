import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function normalizeGroupBy(groupBy) {
  const value = String(groupBy || 'keyword').trim().toLowerCase()
  if (['keyword', 'topic', 'journal'].includes(value)) return value
  return 'keyword'
}

export function getReportParams(filters = {}) {
  const top = Number(filters.top)
  return {
    YearFrom: filters.yearFrom || undefined,
    YearTo: filters.yearTo || undefined,
    GroupBy: normalizeGroupBy(filters.groupBy),
    Top: Number.isFinite(top) && top > 0 ? top : undefined,
  }
}

function mapReportItem(item) {
  return {
    id: item.id ?? null,
    key: item.key ?? 'Unknown',
    paperCount: item.paperCount ?? 0,
    totalCitations: item.totalCitations ?? 0,
    rank: item.rank ?? null,
    growthRate: item.growthRate ?? null,
    trendingScore: item.trendingScore ?? null,
    periodYear: item.periodYear ?? null,
    periodMonth: item.periodMonth ?? null,
    reliabilityPercent: item.reliabilityPercent ?? null,
    suggestion: item.suggestion ?? null,
  }
}

export function mapPublicationReport(result, filters = {}) {
  return {
    groupBy: result.groupBy ?? normalizeGroupBy(filters.groupBy),
    yearFrom: result.yearFrom ?? (Number(filters.yearFrom) || null),
    yearTo: result.yearTo ?? (Number(filters.yearTo) || null),
    top: result.top ?? (Number(filters.top) || null),
    totalPapers: result.totalPapers ?? 0,
    totalCitations: result.totalCitations ?? 0,
    averageReliability: result.averageReliability ?? null,
    items: (Array.isArray(result.items) ? result.items : []).map(mapReportItem),
    generatedAt: result.generatedAt ?? null,
  }
}

export async function getPublicationReport(filters = {}) {
  const { data: response } = await api.get('/reports/publications', {
    params: getReportParams(filters),
  })
  const result = unwrapResponse(response, 'Failed to load publication report.')
  return mapPublicationReport(result, filters)
}

function escapeCsv(value) {
  const text = String(value ?? '')
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** Build CSV from an already-generated report (same columns as BE ExportCsv). */
export function buildReportCsv(report) {
  const lines = [
    'ScholarTrend Publication Report',
    `groupBy,${escapeCsv(report.groupBy)}`,
    `yearFrom,${report.yearFrom ?? ''}`,
    `yearTo,${report.yearTo ?? ''}`,
    `top,${report.top ?? ''}`,
    `totalPapers,${report.totalPapers ?? 0}`,
    `totalCitations,${report.totalCitations ?? 0}`,
    `averageReliability,${report.averageReliability ?? ''}`,
    `generatedAt,${report.generatedAt ?? ''}`,
    '',
    'rank,id,key,paperCount,totalCitations,growthRate,trendingScore,periodYear,periodMonth,reliabilityPercent,suggestion',
  ]

  for (const item of report.items ?? []) {
    lines.push(
      [
        item.rank ?? '',
        item.id ?? '',
        escapeCsv(item.key),
        item.paperCount ?? 0,
        item.totalCitations ?? 0,
        item.growthRate ?? '',
        item.trendingScore ?? '',
        item.periodYear ?? '',
        item.periodMonth ?? '',
        item.reliabilityPercent ?? '',
        escapeCsv(item.suggestion ?? ''),
      ].join(','),
    )
  }

  return `\uFEFF${lines.join('\n')}`
}

export function buildReportJson(report) {
  return JSON.stringify(report, null, 2)
}

export function downloadTextFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/** @deprecated Prefer client export from generated snapshot via buildReportCsv. */
export async function exportReportAsCsv(filters = {}) {
  const { data } = await api.get('/reports/export/csv', {
    params: getReportParams(filters),
    responseType: 'blob',
  })
  return data
}

/** @deprecated Prefer client export from generated snapshot via buildReportJson. */
export async function exportReportAsJson(filters = {}) {
  const { data } = await api.get('/reports/export/json', {
    params: getReportParams(filters),
    responseType: 'blob',
  })
  return data
}
