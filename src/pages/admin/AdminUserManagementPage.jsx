import { useEffect, useMemo, useState } from "react";
import { deleteUser, getUsers, updateUserRole } from "../../services/adminService";
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
  return ROLES.LECTURER_STUDENT;
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

function getStatus(user) {
  if (user.isActive === false || user.active === false) return "Inactive";
  return user.status || "Active";
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
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
  const [pendingId, setPendingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    let active = true;

    async function fetchUsers() {
      setLoading(true);
      setError("");

      try {
        const result = await getUsers();
        if (active) setUsers(normalizeUsers(result));
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

    fetchUsers();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const role = normalizeRole(user.role);
      const matchesRole = roleFilter === "All" || role === roleFilter;
      const matchesKeyword =
        !keyword ||
        getDisplayName(user).toLowerCase().includes(keyword) ||
        String(user.email || "").toLowerCase().includes(keyword);
      return matchesRole && matchesKeyword;
    });
  }, [roleFilter, search, users]);

  const activeCount = users.filter((user) => getStatus(user).toLowerCase() === "active").length;
  const adminCount = users.filter((user) => normalizeRole(user.role) === ROLES.ADMIN).length;

  const handleUpdateRole = async (user, role) => {
    const id = user.id ?? user.userId;
    if (!id || role === normalizeRole(user.role)) return;

    setPendingId(id);
    setNotice("");
    try {
      await updateUserRole(id, role);
      setUsers((current) =>
        current.map((item) =>
          (item.id ?? item.userId) === id ? { ...item, role } : item,
        ),
      );
      setNotice(`Role updated for ${getDisplayName(user)}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update this user role.");
    } finally {
      setPendingId(null);
    }
  };

  const handleDeactivate = async (user) => {
    const id = user.id ?? user.userId;
    if (!id || String(id) === String(currentUserId)) return;

    const confirmed = window.confirm(
      `Deactivate ${getDisplayName(user)}? They will no longer be able to sign in.`,
    );
    if (!confirmed) return;

    setPendingId(id);
    setNotice("");
    try {
      await deleteUser(id);
      setUsers((current) => current.filter((item) => (item.id ?? item.userId) !== id));
      setNotice(`${getDisplayName(user)} was deactivated.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not deactivate this user.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className={styles.userPage}>
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
            <strong>{loading ? "--" : users.length.toLocaleString()}</strong>
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
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className={styles.filterSelect}
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="All">All roles</option>
            {roleOptions.map((role) => (
              <option value={role} key={role}>
                {role === ROLES.LECTURER_STUDENT ? "Lecturer / Student" : role}
              </option>
            ))}
          </select>
          <span className={styles.resultCount}>
            {filteredUsers.length} {filteredUsers.length === 1 ? "result" : "results"}
          </span>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Role</th>
                <th>Joined</th>
                <th><span className={styles.srOnly}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} className={styles.skeletonRow}>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                  </tr>
                ))
              ) : (
                filteredUsers.map((user) => {
                  const id = user.id ?? user.userId;
                  const isCurrentUser = String(id) === String(currentUserId);
                  const status = getStatus(user);
                  const joinedAt = user.createdAt || user.joinedAt || user.registeredAt;
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
                          value={normalizeRole(user.role)}
                          disabled={pendingId === id || isCurrentUser}
                          onChange={(event) => handleUpdateRole(user, event.target.value)}
                          aria-label={`Role for ${getDisplayName(user)}`}
                        >
                          {roleOptions.map((role) => (
                            <option value={role} key={role}>
                              {role === ROLES.LECTURER_STUDENT ? "Lecturer / Student" : role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={styles.joinedCell}>
                        {formatDate(joinedAt)}
                      </td>
                      <td className={styles.actionCell}>
                        <button
                          type="button"
                          className={styles.deactivateButton}
                          disabled={pendingId === id || isCurrentUser}
                          onClick={() => handleDeactivate(user)}
                        >
                          {pendingId === id ? "Working..." : "Deactivate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Icon name="user" size={22} /></div>
            <strong>No users found</strong>
            <p>{error ? "User data will appear when the API is available." : "Try another search or role filter."}</p>
          </div>
        )}
      </article>
    </section>
  );
}

export default AdminUserManagementPage;
