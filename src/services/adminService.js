import api from './api'

/** Lấy danh sách users (Admin only) */
export async function getUsers() {
  const { data } = await api.get('/admin/users')
  return data
}

/** Đổi role user */
export async function updateUserRole(userId, role) {
  const { data } = await api.put(`/admin/users/${userId}/role`, { role })
  return data
}

/** Deactivate user */
export async function deleteUser(userId) {
  await api.delete(`/admin/users/${userId}`)
}

/** System stats (tổng users, papers, sync status) */
export async function getAdminStats() {
  const { data } = await api.get('/admin/stats')
  return data
}

/** Lịch sử sync data */
export async function getSyncLogs() {
  const { data } = await api.get('/admin/sync-logs')
  return data
}
