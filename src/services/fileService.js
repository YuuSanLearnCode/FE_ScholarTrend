import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response || response.success === false || response.data == null) {
    throw new Error(response?.message || response?.errors?.[0] || fallbackMessage)
  }
  return response.data
}

/**
 * Tải một file lên hệ thống
 * @param {File} file 
 * @param {string} type - Loại file (Ví dụ: 'document', 'image')
 */
export async function uploadFile(file, category = 'document', description = '', paperId = null) {
  const formData = new FormData()
  formData.append('file', file)
  if (category) {
    formData.append('category', category)
  }
  if (description) {
    formData.append('description', description)
  }
  if (paperId) {
    formData.append('paperId', paperId)
  }

  const { data: response } = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return unwrapResponse(response, 'Failed to upload file.')
}

/**
 * Tải ảnh đại diện cho user
 * @param {File} file 
 */
export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)

  const { data: response } = await api.post('/files/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return unwrapResponse(response, 'Failed to upload avatar.')
}

/**
 * Lấy danh sách các file (Dành cho admin hoặc lấy danh sách file cá nhân tùy logic backend)
 */
export async function getFiles(params = {}) {
  const { data: response } = await api.get('/files', { params })
  
  if (response && typeof response === 'object' && 'success' in response) {
    return unwrapResponse(response, 'Failed to load files.')
  }
  
  return response
}

/**
 * Tải file về (Download)
 * @param {number|string} id 
 */
export async function downloadFile(id) {
  const response = await api.get(`/files/${id}/download`, {
    responseType: 'blob', // Quan trọng: Yêu cầu tải dữ liệu dạng blob (file nhị phân)
  })

  return response.data
}

/**
 * Xóa một file
 * @param {number|string} id 
 */
export async function deleteFile(id) {
  const { data: response } = await api.delete(`/files/${id}`)
  return unwrapResponse(response, 'Failed to delete file.')
}
