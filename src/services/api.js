import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141/api',
})

// Tự động gắn JWT token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Xử lý lỗi toàn cục: 401 → redirect, và làm đẹp message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isLoginRequest =
      requestUrl.endsWith('/auth/login') || requestUrl.endsWith('/auth/google-login')

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userName')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      window.location.href = '/login'
    }

    // Làm đẹp (Beautify) các lỗi kỹ thuật thô kệch (ví dụ: "Request failed with status code 403")
    if (error.response) {
      const status = error.response.status
      if (status === 403) {
        error.message = '⭐ Premium Feature: Please upgrade your account to unlock this feature.'
      } else if (status === 429) {
        error.message = 'Too many requests. Please slow down and try again later.'
      } else if (status >= 500) {
        error.message = 'The server encountered an issue. Please try again later.'
      } else if (error.message?.includes('status code')) {
        error.message = 'An unexpected error occurred while communicating with the server.'
      }
    } else if (error.message === 'Network Error') {
      error.message = 'Unable to connect to the server. Please check your connection.'
    } else if (error.message?.includes('status code')) {
      error.message = 'Failed to connect to the server.'
    }

    // Đẩy message thân thiện này vào chung cấu trúc để UI ưu tiên hiển thị
    if (error.response && (!error.response.data || !error.response.data.message || error.response.data.message.includes('status code'))) {
      error.response.data = {
        ...error.response.data,
        message: error.message
      }
    }

    return Promise.reject(error)
  }
)

export default api
