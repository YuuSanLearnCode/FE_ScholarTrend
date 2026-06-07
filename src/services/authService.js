import api from './api'

/**
 * Đăng nhập → trả { token, user }
 * Lưu token + user info vào localStorage
 */
export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password })
  localStorage.setItem('token', data.token)
  localStorage.setItem('userName', data.user.fullName)
  localStorage.setItem('userRole', data.user.role)
  localStorage.setItem('userId', data.user.id)
  return data
}

/**
 * Đăng ký → trả { token, user }
 * Tự động đăng nhập luôn sau khi đăng ký
 */
export async function register({ fullName, email, password, institution, researchField }) {
  const { data } = await api.post('/auth/register', {
    fullName,
    email,
    password,
    institution: institution || undefined,
    researchField: researchField || undefined,
  })
  localStorage.setItem('token', data.token)
  localStorage.setItem('userName', data.user.fullName)
  localStorage.setItem('userRole', data.user.role)
  localStorage.setItem('userId', data.user.id)
  return data
}

/**
 * Lấy thông tin user hiện tại (dùng JWT token)
 */
export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}

/**
 * Logout → xóa localStorage
 */
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
  window.location.href = '/'
}
