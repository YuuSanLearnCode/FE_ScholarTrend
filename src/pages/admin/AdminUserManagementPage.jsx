import { useEffect, useState } from 'react'
import { getUsers, updateUserRole, deleteUser } from '../../services/adminService'
import styles from './adminUserManagementPage.module.css'

function AdminUserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'researcher' })

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await getUsers()
        setUsers(result ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users')
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const addUser = (event) => {
    event.preventDefault()

    if (!newUser.name.trim() || !newUser.email.trim()) {
      return
    }

    // Add user locally (no create user API specified)
    setUsers((prev) => [...prev, { id: Date.now(), ...newUser }])
    setNewUser({ name: '', email: '', role: 'researcher' })
  }

  const removeUser = async (id) => {
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((user) => user.id !== id))
    } catch (err) {
      // silently fail
    }
  }

  const handleUpdateRole = async (id, role) => {
    try {
      await updateUserRole(id, role)
      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role } : user)))
    } catch (err) {
      // silently fail
    }
  }

  if (loading) {
    return (
      <section className={styles.userMgmtPage}>
        <Skeleton variant="title" width="40%" />
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.userMgmtPage}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.userMgmtPage}>
      <h1 className={styles.pageTitle}>User Management</h1>
      <div className={styles.panel}>
        <form className={styles.form} onSubmit={addUser}>
          <input
            className={styles.input}
            placeholder="Name"
            value={newUser.name}
            onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            className={styles.input}
            placeholder="Email"
            type="email"
            value={newUser.email}
            onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
          />
          <select
            className={styles.input}
            value={newUser.role}
            onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
          >
            <option value="researcher">Researcher</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className={styles.button}>
            Add User
          </button>
        </form>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(event) => handleUpdateRole(user.id, event.target.value)}
                    className={styles.input}
                  >
                    <option value="researcher">Researcher</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button type="button" className={styles.danger} onClick={() => removeUser(user.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AdminUserManagementPage
