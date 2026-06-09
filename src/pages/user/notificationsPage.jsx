import { useEffect, useState } from 'react'
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService'
import Skeleton from '../../components/Skeleton'
import styles from './simpleListPage.module.css'

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const result = await getNotifications()
        setNotifications(result ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notifications')
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (err) {
      // silently fail
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      // silently fail
    }
  }

  if (loading) {
    return (
      <section className={styles.panel}>
        <Skeleton variant="title" width="30%" />
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.panel}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.panel}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Notifications</h1>
        <button
          type="button"
          onClick={handleMarkAllAsRead}
          style={{
            marginLeft: 'auto',
            cursor: 'pointer',
            background: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#94a3b8',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
          }}
        >
          Mark all read
        </button>
      </div>
      <ul className={styles.list}>
        {notifications.length === 0 && (
          <li className={styles.listItem}>
            <span className={styles.listItemText}>No notifications.</span>
          </li>
        )}
        {notifications.map((item) => {
          const id = item.id ?? item
          const message = item.message ?? item.text ?? String(item)
          const isRead = item.read ?? false
          return (
            <li
              key={id}
              className={styles.listItem}
              style={{
                opacity: isRead ? 0.6 : 1,
                cursor: isRead ? 'default' : 'pointer',
              }}
              onClick={() => !isRead && handleMarkAsRead(id)}
            >
              <span className={styles.listItemText}>
                {!isRead && '● '}{message}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default NotificationsPage
