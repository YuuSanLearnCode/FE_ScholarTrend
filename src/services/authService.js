import api from './api'

function persistAuthSession(auth) {
  localStorage.setItem('token', auth.token)
  localStorage.setItem('refreshToken', auth.refreshToken || '')
  localStorage.setItem('userName', auth.fullName || '')
  localStorage.setItem('userRole', auth.roles?.[0] || '')
  localStorage.setItem('userId', auth.userId || '')
}

export async function login({ email, password }) {
  const { data: response } = await api.post('/auth/login', {
    email: email.trim(),
    password,
  })

  if (!response.success || !response.data?.token) {
    throw new Error(response.message || 'Login failed.')
  }

  const auth = response.data
  persistAuthSession(auth)
  return auth
}

export async function googleLogin(idToken) {
  const normalizedIdToken = idToken?.trim()
  if (!normalizedIdToken) {
    throw new Error('Google ID token is required.')
  }

  const { data: response } = await api.post('/auth/google-login', {
    idToken: normalizedIdToken,
  })

  if (!response.success || !response.data?.token) {
    throw new Error(response.message || 'Google login failed.')
  }

  const auth = response.data
  persistAuthSession(auth)
  return auth
}

export async function register({
  fullName,
  email,
  password,
  confirmPassword,
  institution,
  researchField,
}) {
  const { data: response } = await api.post('/auth/register', {
    fullName: fullName.trim(),
    email: email.trim(),
    password,
    confirmPassword,
    institution: institution.trim(),
    researchField: researchField.trim(),
  })

  const auth = response.data
  if (response.success && auth?.token) {
    persistAuthSession(auth)
  }

  return auth
}

export async function getMe() {
  const { data: response } = await api.get('/auth/profile')

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to load profile.')
  }

  return response.data
}

export async function updateProfile({ fullName, institution, researchField }) {
  const { data: response } = await api.put('/auth/profile', {
    fullName: fullName.trim(),
    institution: institution.trim(),
    researchField: researchField.trim(),
  })

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to update profile.')
  }

  const profile = response.data
  localStorage.setItem('userName', profile.fullName || '')
  localStorage.setItem('userRole', profile.roles?.[0] || '')
  localStorage.setItem('userId', profile.id || '')
  return profile
}

export async function changePassword(data) {
  const res = await api.put('/auth/change-password', data)
  return res.data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
  window.location.href = '/'
}
