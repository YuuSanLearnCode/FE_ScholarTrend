/**
 * Role constants — khớp với BE enum UserRole
 */
export const ROLES = {
  ADMIN: 'Admin',
  RESEARCHER: 'Researcher',
  LECTURER_STUDENT: 'LecturerStudent',
}

/**
 * Quyền truy cập theo từng role
 *
 * Admin:            Quản lý users, API config, xem stats hệ thống
 * Researcher:       Tất cả tính năng research (search, trends, bookmarks, following, notifications)
 * LecturerStudent:  Search + xem trends + bookmarks (KHÔNG có following, KHÔNG có notifications nâng cao)
 */
export const PERMISSIONS = {
  // Ai cũng truy cập được (kể cả chưa đăng nhập)
  public: ['/', '/login', '/register', '/search', '/search/results'],

  // Cần đăng nhập
  authenticated: ['/dashboard', '/papers'],

  // Chỉ Researcher + Admin
  researcherOnly: ['/following', '/notifications'],

  // Chỉ Admin
  adminOnly: ['/admin'],
}

/**
 * Navigation items theo role
 */
export function getNavItems(role) {
  const common = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Search' },
    { to: '/trends', label: 'Trends' },
  ]

  if (!role) return common

  const authenticated = [
    { to: '/dashboard', label: 'Dashboard' },
    ...common.slice(1), // skip Home, add Search + Trends
    { to: '/bookmarks', label: 'Bookmarks' },
    { to: '/profile', label: 'Profile' },
  ]

  if (role === ROLES.LECTURER_STUDENT) {
    return [
      { to: '/', label: 'Home' },
      ...authenticated,
    ]
  }

  if (role === ROLES.RESEARCHER) {
    return [
      { to: '/', label: 'Home' },
      ...authenticated,
      { to: '/following', label: 'Following' },
      { to: '/notifications', label: 'Notifications' },
    ]
  }

  if (role === ROLES.ADMIN) {
    return [
      { to: '/', label: 'Home' },
      ...authenticated,
      { to: '/following', label: 'Following' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/admin', label: 'Admin Panel' },
    ]
  }

  return common
}

/**
 * Kiểm tra user có quyền truy cập route không
 */
export function canAccess(role, path) {
  // Public routes — ai cũng vào được
  if (PERMISSIONS.public.some((p) => path === p || path.startsWith(p + '/'))) {
    return true
  }

  if (!role) return false

  // Admin routes
  if (path.startsWith('/admin')) {
    return role === ROLES.ADMIN
  }

  // Researcher-only routes
  if (PERMISSIONS.researcherOnly.some((p) => path === p || path.startsWith(p + '/'))) {
    return role === ROLES.RESEARCHER || role === ROLES.ADMIN
  }

  // Authenticated routes — tất cả roles đều vào được
  return true
}
