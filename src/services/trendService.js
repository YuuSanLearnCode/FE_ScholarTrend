import api from './api'

/** Top trending keywords */
export async function getKeywordTrends(top = 10) {
  const { data } = await api.get('/trends/keywords', { params: { top } })
  return data
}

/** Top trending topics */
export async function getTopicTrends(top = 10) {
  const { data } = await api.get('/trends/topics', { params: { top } })
  return data
}

/** Tổng quan: total papers, journals, users... */
export async function getTrendOverview() {
  const { data } = await api.get('/trends/overview')
  return data
}

/** Số lượng paper theo năm (cho biểu đồ) */
export async function getTrendByYear(params = {}) {
  const { data } = await api.get('/trends/by-year', { params })
  return data
}
