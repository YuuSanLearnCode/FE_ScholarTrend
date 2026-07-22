import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate, ScrollRestoration } from "react-router-dom";
import { getUnreadNotificationCount } from "../../services/notificationService";
import styles from "./adminLayout.module.css";

const sidebarLinks = [
  { to: "/admin", label: "Overview", description: "System dashboard", icon: "dashboard", end: true },
  { to: "/admin/users", label: "Users", description: "Accounts and roles", icon: "users" },
  { to: "/admin/api-config", label: "Integrations", description: "API and data sync", icon: "settings" },
  { to: "/admin/gap-analysis", label: "Gap analysis", description: "Quality assessment", icon: "gap" },
  { to: "/admin/pdf-management", label: "PDF extraction", description: "PDF text for AI", icon: "pdf" },
];

const pageNames = {
  "/admin": "Overview",
  "/admin/users": "User management",
  "/admin/api-config": "API & integrations",
  "/admin/gap-analysis": "AdminGapAnalysis",
  "/admin/pdf-management": "PDF extraction",
};

function Icon({ name, size = 20 }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.09 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.09V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.91 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
    gap: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
        <path d="M7 8h4M7 12h2" />
      </>
    ),
    pdf: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    external: (
      <>
        <path d="M15 3h6v6M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const userName = localStorage.getItem("userName") || "Administrator";
  const currentPage = pageNames[location.pathname] || "Admin";



  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className={styles.layout}>
      <button
        type="button"
        aria-label="Close navigation"
        className={`${styles.backdrop} ${menuOpen ? styles.backdropVisible : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>S</div>
          <div>
            <div className={styles.brandName}>ScholarTrend</div>
            <div className={styles.brandSub}>Control center</div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className={styles.workspaceLabel}>Workspace</div>
        <nav className={styles.nav} aria-label="Admin navigation">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span className={styles.navIcon}>
                <Icon name={link.icon} />
              </span>
              <span>
                <span className={styles.navLabel}>{link.label}</span>
                <span className={styles.navDescription}>{link.description}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <NavLink to="/" className={styles.siteLink}>
            <Icon name="external" size={18} />
            View public website
          </NavLink>
          <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
            <Icon name="logout" size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className={styles.contentShell}>
        <header className={styles.topbar}>
          <div className={styles.topbarStart}>
            <button
              type="button"
              className={styles.menuButton}
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <div>
              <span className={styles.eyebrow}>Admin console</span>
              <h1 className={styles.topbarTitle}>{currentPage}</h1>
            </div>
          </div>
          <div className={styles.account}>

            <div className={styles.accountText}>
              <strong>{userName}</strong>
              <span>Administrator</span>
            </div>
            <div className={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main className={styles.mainContent}>
          <ScrollRestoration />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
