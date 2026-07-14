import api from './api'

function getPrimaryRole(auth) {
  if (Array.isArray(auth.roles)) {
    const roles = auth.roles.map(r => String(r).toLowerCase());
    if (roles.includes('admin')) return 'Admin';
    if (roles.includes('researcher')) return 'Researcher';
    return auth.roles[0] || '';
  }

  return auth.roles || auth.role || ''
}

function persistAuthSession(auth) {
  localStorage.setItem('token', auth.token)
  localStorage.setItem('refreshToken', auth.refreshToken || '')
  localStorage.setItem('userName', auth.fullName || '')
  localStorage.setItem('userRole', getPrimaryRole(auth))
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
  const { data: response } = await api.post('/auth/change-password', data)
  if (!response.success) {
    throw new Error(response.message || 'Failed to change password.')
  }
  return response
}

export async function verifyEmail({ email, token }) {
  const { data: response } = await api.post('/auth/verify-email', {
    email,
    token,
  })

  if (!response.success) {
    throw new Error(response.message || 'Email verification failed.')
  }

  return response
}

// Gửi lại email xác nhận
export async function resendVerification({ email }) {
  const { data: response } = await api.post('/auth/resend-verification', {
    email: email.trim(),
  })

  if (!response.success) {
    throw new Error(response.message || 'Failed to resend verification email.')
  }

  return response
}

// Gửi email reset mật khẩu
export async function forgotPassword({ email }) {
  const { data: response } = await api.post('/auth/forgot-password', {
    email: email.trim(),
  })

  if (!response.success) {
    throw new Error(response.message || 'Failed to send reset password email.')
  }

  return response
}

// Reset mật khẩu bằng token từ email
export async function resetPassword({ email, token, newPassword, confirmNewPassword }) {
  const { data: response } = await api.post('/auth/reset-password', {
    email: email.trim(),
    token,
    newPassword,
    confirmNewPassword,
  })

  if (!response.success) {
    throw new Error(response.message || 'Failed to reset password.')
  }

  return response
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
  window.location.href = '/'
}
