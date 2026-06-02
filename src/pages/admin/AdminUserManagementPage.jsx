import { useState } from 'react'
import { adminUsers } from '../../data/mockData'
import styles from './adminUserManagementPage.module.css'

function AdminUserManagementPage() {
  const [users, setUsers] = useState(adminUsers)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'researcher' })

  const addUser = (event) => {
    event.preventDefault()

    if (!newUser.name.trim() || !newUser.email.trim()) {
      return
    }

    setUsers((prev) => [...prev, { id: Date.now(), ...newUser }])
    setNewUser({ name: '', email: '', role: 'researcher' })
  }

  const removeUser = (id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id))
  }

  const updateRole = (id, role) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role } : user)))
  }

  return (
    <section className={styles.panel}>
      <h1>Admin User Management</h1>
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
                  onChange={(event) => updateRole(user.id, event.target.value)}
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
    </section>
  )
}

export default AdminUserManagementPage
