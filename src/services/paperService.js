import api from './api'

/**
 * Tìm kiếm papers
 * @param {{ keyword?, author?, journal?, yearFrom?, yearTo?, page?, pageSize? }} params
 * @returns {{ items: Paper[], totalCount, page, pageSize, totalPages }}
 */
export async function searchPapers(params = {}) {
  const { data } = await api.get('/papers', { params })
  return data
}

/**
 * Lấy chi tiết 1 paper
 * @param {number} id
 * @returns {Paper}
 */
export async function getPaperById(id) {
  const { data } = await api.get(`/papers/${id}`)
  return data
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
  const { data } = await api.get('/papers', { params: { ...params, author: authorName } })
  return data
}

/**
 * Ghi nhận lượt xem paper
 */
export async function recordView(paperId) {
  const { data } = await api.post(`/papers/${paperId}/view`)
  return data
}
