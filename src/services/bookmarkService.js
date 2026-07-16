import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

export async function getBookmarks({ page = 1, pageSize = 10 } = {}) {
  const { data: response } = await api.get('/bookmarks', {
    params: { page, pageSize }
  })
  return unwrapResponse(response, 'Failed to load bookmarks.')
}

export async function addBookmark(paperId) {
  const { data: response } = await api.post(`/bookmarks/${paperId}`)
  return unwrapResponse(response, 'Failed to bookmark this paper.')
}

export async function removeBookmark(paperId) {
  const { data: response } = await api.delete(`/bookmarks/${paperId}`)
  return unwrapResponse(response, 'Failed to remove this bookmark.')
}
