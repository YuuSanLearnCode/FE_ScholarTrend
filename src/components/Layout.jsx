import { useEffect, useState } from "react";
import { NavLink, Outlet, ScrollRestoration } from "react-router-dom";
import { getUnreadNotificationCount } from "../services/notificationService";
import { getNavItems, ROLES } from "../utils/roles";
import styles from "./Layout.module.css";

function Layout() {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  const avatarStorageKey = userId ? `profileAvatar:${userId}` : "";
  const [userAvatar, setUserAvatar] = useState(
    avatarStorageKey ? localStorage.getItem(avatarStorageKey) || "" : "",
  );
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthenticated = Boolean(token);
  const navItems = getNavItems(isAuthenticated ? userRole : null);

  useEffect(() => {
    const handleAvatarUpdated = (event) => {
      if (event.detail?.userId === userId) {
        setUserAvatar(event.detail.image || "");
      }
    };

    window.addEventListener("profile-avatar-updated", handleAvatarUpdated);
    return () => window.removeEventListener("profile-avatar-updated", handleAvatarUpdated);
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let active = true;
    const refreshUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount('User');
        if (active) setUnreadNotifications(count);
      } catch {
        if (active) setUnreadNotifications(0);
      }
    };

    refreshUnreadCount();
    const intervalId = window.setInterval(refreshUnreadCount, 30000);
    window.addEventListener("focus", refreshUnreadCount);
    window.addEventListener("notifications-updated", refreshUnreadCount);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshUnreadCount);
      window.removeEventListener("notifications-updated", refreshUnreadCount);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return "Admin";
      case ROLES.RESEARCHER:
        return "Researcher";
      case ROLES.LECTURER_STUDENT:
        return "Lecturer / Student";
      default:
        return "";
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.brandText}>ScholarTrend</span>
          </NavLink>

          <nav className={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ""}`
                }
              >
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={styles.authActions}>
            {token ? (
              <>
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    `${styles.notificationButton} ${
                      isActive ? styles.notificationButtonActive : ""
                    }`
                  }
                  aria-label={
                    unreadNotifications > 0
                      ? `${unreadNotifications} unread notifications`
                      : "Notifications"
                  }
                  title="Notifications"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 15.5V10a6 6 0 0 0-12 0v5.5L4.8 17h14.4L18 15.5Z" />
                    <path d="M10 20a2 2 0 0 0 4 0" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className={styles.notificationBadge} aria-hidden="true">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </NavLink>
                <div className={styles.userMenu}>
                  <button
                    type="button"
                    className={styles.avatarBtn}
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                  >
                    <span className={styles.userAvatar}>
                      {userAvatar ? (
                        <img src={userAvatar} alt="" />
                      ) : (
                        userName ? userName.charAt(0).toUpperCase() : "U"
                      )}
                    </span>
                    <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {menuOpen && (
                    <>
                      <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />
                      <div className={styles.dropdown}>
                        <div className={styles.dropdownHeader}>
                          <span className={styles.dropdownName}>{userName}</span>
                          {userRole && <span className={styles.dropdownRole}>{getRoleLabel(userRole)}</span>}
                        </div>
                        <div className={styles.dropdownDivider} />
                        <NavLink to="/following" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>Following</NavLink>
                        <NavLink to="/profile" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>Profile</NavLink>
                        <NavLink to="/payment/history" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>Billing</NavLink>
                        <button type="button" className={styles.dropdownItem} onClick={handleLogout}>Logout</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={styles.loginBtn}>
                  Login
                </NavLink>
                <NavLink to="/register" className={styles.registerBtn}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <ScrollRestoration />
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>ScholarTrend</span>
          <span className={styles.footerCopy}>
            © {new Date().getFullYear()} ScholarTrend. Built for researchers.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
