import { useEffect, useMemo, useState } from "react";
import { getAdminDashboard, getUserById, getUsers, updateUserRole, updateUserStatus } from "../../services/adminService";
import Pagination from "../../components/Pagination";
import { ROLES } from "../../utils/roles";
import styles from "./AdminUserManagementPage.module.css";

const roleOptions = [ROLES.ADMIN, ROLES.RESEARCHER, ROLES.LECTURER_STUDENT];

function Icon({ name, size = 18 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    alert: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
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

function normalizeUsers(result) {
  const users = result?.items || result?.users || result?.data || result;
  return Array.isArray(users) ? users : [];
}

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  if (value === "admin") return ROLES.ADMIN;
  if (value === "researcher") return ROLES.RESEARCHER;
  if (value === "lecturerstudent" || value === "lecturer_student") {
    return ROLES.LECTURER_STUDENT;
  }
  return "";
}

function formatRoleLabel(role) {
  return role === ROLES.LECTURER_STUDENT ? "Lecturer / Student" : role;
}

function getUserRoles(user) {
  const rawRoles = user.roles ?? user.role ?? user.userRoles ?? [];
  const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  return roles.map(normalizeRole).filter(Boolean);
}

function getPrimaryRole(user) {
  return getUserRoles(user)[0] || ROLES.LECTURER_STUDENT;
}

function userHasRole(user, role) {
  return getUserRoles(user).includes(role);
}

function getDisplayName(user) {
  return user.fullName || user.name || user.userName || "Unnamed user";
}

function getInitials(user) {
  return getDisplayName(user)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function isUserActive(user) {
  return user.isActive !== false && user.active !== false;
}

function getStatus(user) {
  if (!isUserActive(user)) return "Inactive";
  return user.status || "Active";
}

function getUserId(user) {
  return user?.id ?? user?.userId;
}

function formatDate(value) {
  if (!value) return "Not available";
  let dateString = value;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    dateString += 'Z';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null, nextActive: false });
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    let active = true;
    getAdminDashboard()
      .then((res) => {
        if (active) setStats(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    window.scrollTo({ top: 0, behavior: "smooth" });

    async function fetchUsers() {
      setLoading(true);
      setError("");

      try {
        const result = await getUsers({
          search,
          role: roleFilter,
          isActive: activeFilter,
          page: currentPage,
          pageSize,
        });
        if (active) {
          setUsers(normalizeUsers(result));
          setTotalPages(result?.totalPages || 1);
          setTotalUsers(result?.totalCount || 0);
        }
      } catch (requestError) {
        if (active) {
          setUsers([]);
          setError(
            requestError.response?.data?.message ||
              "Unable to load users. Check that the backend API is running.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    const timerId = window.setTimeout(fetchUsers, search.trim() ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [activeFilter, refreshKey, roleFilter, search, currentPage, pageSize]);

  const activeCount = stats?.activeUsers || 0;
  const adminCount = stats?.usersByRole?.Admin || stats?.usersByRole?.admin || 0;
  const totalStatsCount = stats?.totalUsers || 0;

  const handleUpdateRole = async (user, role) => {
    const id = getUserId(user);
    if (!id || role === getPrimaryRole(user)) return;

    setPendingId(id);
    setNotice("");
    try {
      const result = await updateUserRole(id, role);
      const updatedUser = {
        ...user,
        ...(result || {}),
        role: result?.role ?? role,
        roles: result?.roles ?? [role],
      };

      setUsers((current) =>
        current.map((item) =>
          String(getUserId(item)) === String(id) ? { ...item, ...updatedUser } : item,
        ),
      );

      if (String(getUserId(selectedUser)) === String(id)) {
        setSelectedUser((current) => ({ ...current, ...updatedUser }));
      }

      setNotice(`Role updated for ${getDisplayName(updatedUser)}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update this user role.");
    } finally {
      setPendingId(null);
    }
  };

  const handleViewDetails = async (user) => {
    const id = getUserId(user);
    if (!id) return;

    setSelectedUser(user);
    setDetailLoading(true);
    setDetailError("");

    try {
      const result = await getUserById(id);
      setSelectedUser(result || user);
    } catch (requestError) {
      setDetailError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not load this user detail.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setDetailError("");
  };

  const handleToggleStatus = async (user) => {
    const id = getUserId(user);
    if (!id || String(id) === String(currentUserId)) return;

    const nextActive = !isUserActive(user);
    if (!nextActive) {
      setConfirmModal({ isOpen: true, user, nextActive });
      return;
    }

    executeToggleStatus(user, nextActive);
  };

  const executeToggleStatus = async (user, nextActive) => {
    const id = getUserId(user);
    if (!id) return;

    setPendingId(id);
    setNotice("");
    try {
      const result = await updateUserStatus(id, nextActive);
      const updatedUser = {
        ...user,
        ...(result || {}),
        isActive: result?.isActive ?? nextActive,
      };

      setUsers((current) =>
        current.map((item) =>
          String(getUserId(item)) === String(id) ? { ...item, ...updatedUser } : item,
        ),
      );

      if (String(getUserId(selectedUser)) === String(id)) {
        setSelectedUser((current) => ({ ...current, ...updatedUser }));
      }

      setNotice(
        `${getDisplayName(updatedUser)} was ${nextActive ? "activated" : "deactivated"}.`,
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update this user status.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className={styles.userPage}>
      {confirmModal.isOpen && (
        <div className={styles.confirmBackdrop}>
          <div className={styles.confirmPanel}>
            <div className={styles.confirmHeader}>
              <div className={styles.confirmIconWrap}>
                <Icon name="alert" size={24} />
              </div>
              <h3>Deactivate {getDisplayName(confirmModal.user)}?</h3>
            </div>
            <p className={styles.confirmText}>
              They will no longer be able to sign in to their account. You can reactivate them later if needed.
            </p>
            <div className={styles.confirmActions}>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={() => setConfirmModal({ isOpen: false, user: null, nextActive: false })}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.confirmDeactivateBtn}
                onClick={() => {
                  executeToggleStatus(confirmModal.user, confirmModal.nextActive);
                  setConfirmModal({ isOpen: false, user: null, nextActive: false });
                }}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.hero}>
        <div>
          <span className={styles.kicker}>Access control</span>
          <h2 className={styles.pageTitle}>Manage your community</h2>
          <p className={styles.pageSubtitle}>
            Review member access and keep administrative permissions under control.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          <Icon name="refresh" />
          Refresh
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <strong>Something needs attention.</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            Close
          </button>
        </div>
      )}

      {notice && (
        <div className={styles.successBanner} role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
            Close
          </button>
        </div>
      )}

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Icon name="user" />
          </div>
          <div>
            <span>Total accounts</span>
            <strong>{loading && !stats ? "--" : totalStatsCount.toLocaleString()}</strong>
          </div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Icon name="user" />
          </div>
          <div>
            <span>Active accounts</span>
            <strong>{loading ? "--" : activeCount.toLocaleString()}</strong>
          </div>
        </article>
        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Icon name="lock" />
          </div>
          <div>
            <span>Administrators</span>
            <strong>{loading ? "--" : adminCount.toLocaleString()}</strong>
          </div>
        </article>
      </div>

      <article className={styles.tablePanel}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Icon name="search" />
            <input
              type="search"
              aria-label="Search users"
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            className={styles.filterSelect}
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All roles</option>
            {roleOptions.map((role) => (
              <option value={role} key={role}>
                {formatRoleLabel(role)}
              </option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            aria-label="Filter by active status"
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            className={styles.filterSelect}
            aria-label="Items per page"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
          <span className={styles.resultCount}>
            {totalUsers} {totalUsers === 1 ? "result" : "results"}
          </span>
        </div>

        <div 
          className={styles.tableScroll} 
          style={{ 
            opacity: loading ? 0.5 : 1, 
            transition: "opacity 0.2s ease-in-out",
            pointerEvents: loading ? "none" : "auto" 
          }}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Institution</th>
                <th>Status</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Last login</th>
                <th><span className={styles.srOnly}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} className={styles.skeletonRow}>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                  </tr>
                ))
              ) : (
                users.map((user) => {
                  const id = getUserId(user);
                  const isCurrentUser = String(id) === String(currentUserId);
                  const status = getStatus(user);
                  const joinedAt = user.createdAt || user.joinedAt || user.registeredAt;
                  const lastLoginAt = user.lastLoginAt || user.lastSeenAt;
                  return (
                    <tr key={id || user.email}>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.userAvatar}>{getInitials(user) || "U"}</span>
                          <span>
                            <strong>
                              {getDisplayName(user)}
                              {isCurrentUser && <small>You</small>}
                            </strong>
                            <span>{user.email || "No email provided"}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.institutionCell}>
                          <strong>{user.institution || "No institution"}</strong>
                          <span>{user.researchField || "No research field"}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            status.toLowerCase() === "active" ? styles.active : styles.inactive
                          }`}
                        >
                          <i />
                          {status}
                        </span>
                      </td>
                      <td>
                        <select
                          className={styles.roleSelect}
                          value={getPrimaryRole(user)}
                          disabled={pendingId === id || isCurrentUser}
                          onChange={(event) => handleUpdateRole(user, event.target.value)}
                          aria-label={`Role for ${getDisplayName(user)}`}
                        >
                          {roleOptions.map((role) => (
                            <option value={role} key={role}>
                              {formatRoleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={styles.joinedCell}>
                        {formatDate(joinedAt)}
                      </td>
                      <td className={styles.joinedCell}>
                        {formatDate(lastLoginAt)}
                      </td>
                      <td className={styles.actionCell}>
                        <div className={styles.actionStack}>
                          <button
                            type="button"
                            className={styles.detailButton}
                            disabled={detailLoading && String(getUserId(selectedUser)) === String(id)}
                            onClick={() => handleViewDetails(user)}
                          >
                            {detailLoading && String(getUserId(selectedUser)) === String(id)
                              ? "Loading..."
                              : "Details"}
                          </button>
                          <button
                            type="button"
                            className={
                              isUserActive(user) ? styles.deactivateButton : styles.activateButton
                            }
                            disabled={pendingId === id || isCurrentUser}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {pendingId === id
                              ? "Working..."
                              : isUserActive(user)
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Icon name="user" size={22} /></div>
            <strong>No users found</strong>
            <p>{error ? "User data will appear when the API is available." : "Try another search or role filter."}</p>
          </div>
        )}
      </article>

      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedUser && (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeDetails}>
          <aside
            className={styles.detailPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.detailHeader}>
              <div className={styles.detailIdentity}>
                <span className={styles.userAvatar}>{getInitials(selectedUser) || "U"}</span>
                <div>
                  <span className={styles.kicker}>User detail</span>
                  <h3 id="admin-user-detail-title">{getDisplayName(selectedUser)}</h3>
                  <p>{selectedUser.email || "No email provided"}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close user detail"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>

            {detailLoading && <p className={styles.detailLoading}>Loading latest user data...</p>}
            {detailError && (
              <div className={styles.detailError} role="alert">
                {detailError}
              </div>
            )}

            <div className={styles.detailStatusRow}>
              <span
                className={`${styles.status} ${
                  getStatus(selectedUser).toLowerCase() === "active"
                    ? styles.active
                    : styles.inactive
                }`}
              >
                <i />
                {getStatus(selectedUser)}
              </span>
              <div className={styles.rolePills}>
                {getUserRoles(selectedUser).length > 0 ? (
                  getUserRoles(selectedUser).map((role) => (
                    <span className={styles.rolePill} key={role}>
                      {formatRoleLabel(role)}
                    </span>
                  ))
                ) : (
                  <span className={styles.rolePill}>No role</span>
                )}
              </div>
            </div>

            <div className={styles.detailActions}>
              <button
                type="button"
                className={
                  isUserActive(selectedUser) ? styles.deactivateButton : styles.activateButton
                }
                disabled={
                  pendingId === getUserId(selectedUser) ||
                  String(getUserId(selectedUser)) === String(currentUserId)
                }
                onClick={() => handleToggleStatus(selectedUser)}
              >
                {pendingId === getUserId(selectedUser)
                  ? "Working..."
                  : isUserActive(selectedUser)
                    ? "Deactivate account"
                    : "Activate account"}
              </button>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span>User ID</span>
                <strong>{getUserId(selectedUser) || "Not available"}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Email</span>
                <strong>{selectedUser.email || "Not available"}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Institution</span>
                <strong>{selectedUser.institution || "Not available"}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Research field</span>
                <strong>{selectedUser.researchField || "Not available"}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Created at</span>
                <strong>{formatDate(selectedUser.createdAt)}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Last login</span>
                <strong>{formatDate(selectedUser.lastLoginAt)}</strong>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default AdminUserManagementPage;
