import api from './api'

/** Lấy danh sách bookmarks của user */
export async function getBookmarks() {
  const { data } = await api.get('/bookmarks')
  return data
}

/** Bookmark 1 paper */
export async function addBookmark(paperId) {
  const { data } = await api.post('/bookmarks', { paperId })
  return data
}

/** Xóa bookmark */
export async function removeBookmark(paperId) {
  await api.delete(`/bookmarks/${paperId}`)
}
