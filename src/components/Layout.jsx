import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getUnreadNotificationCount } from "../services/notificationService";
import { getNavItems, ROLES } from "../utils/roles";
import styles from "./layout.module.css";

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
        const count = await getUnreadNotificationCount();
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
                {item.to === "/notifications" && unreadNotifications > 0 && (
                  <span
                    className={styles.notificationBadge}
                    aria-label={`${unreadNotifications} unread notifications`}
                  >
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
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
                    <span className={styles.notificationBadge}>
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </NavLink>
                <div className={styles.userGreeting}>
                  <span className={styles.userAvatar}>
                    {userAvatar ? (
                      <img src={userAvatar} alt="" />
                    ) : (
                      userName ? userName.charAt(0).toUpperCase() : "U"
                    )}
                  </span>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{userName}</span>
                    {userRole && (
                      <span className={styles.userRole}>
                        {getRoleLabel(userRole)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                >
                  Logout
                </button>
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
