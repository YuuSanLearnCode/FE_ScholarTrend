import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Skeleton from '../../components/Skeleton'
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '../../services/notificationService'
import styles from './simpleListPage.module.css'

function formatDate(value) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [limit, setLimit] = useState('20')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingId, setMarkingId] = useState(null)

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      setError('')
      try {
        const result = await getNotifications({
          isRead: filter === 'all' ? undefined : filter === 'read',
          limit,
        })
        setNotifications(result)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load notifications')
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [filter, limit])

  const handleMarkAsRead = async (notificationId) => {
    if (markingId === notificationId) return

    setMarkingId(notificationId)
    setError('')
    try {
      await markAsRead(notificationId)
      setNotifications((current) =>
        filter === 'unread'
          ? current.filter((item) => item.id !== notificationId)
          : current.map((item) => (
            item.id === notificationId
              ? { ...item, isRead: true, read: true, readAt: new Date().toISOString() }
              : item
          )),
      )
      window.dispatchEvent(new Event('notifications-updated'))
    } catch {
      setError('Failed to mark notification as read.')
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((current) =>
        filter === 'unread'
          ? []
          : current.map((item) => ({
            ...item,
            isRead: true,
            read: true,
            readAt: new Date().toISOString(),
          })),
      )
      window.dispatchEvent(new Event('notifications-updated'))
    } catch {
      setError('Failed to mark all notifications as read.')
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Notifications</h1>
        <button
          type="button"
          className={styles.markReadBtn}
          onClick={handleMarkAllAsRead}
          disabled={loading || notifications.every((item) => item.isRead)}
        >
          Mark all read
        </button>
      </div>

      <div className={styles.listToolbar}>
        <div className={styles.filterTabs}>
          {['all', 'unread', 'read'].map((value) => (
            <button
              key={value}
              type="button"
              className={filter === value ? styles.filterTabActive : ''}
              onClick={() => setFilter(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <select
          className={styles.limitSelect}
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          aria-label="Notification limit"
        >
          <option value="10">10 latest</option>
          <option value="20">20 latest</option>
          <option value="50">50 latest</option>
        </select>
      </div>

      {error && <p className={styles.listError}>{error}</p>}

      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : (
        <ul className={styles.list}>
          {notifications.length === 0 && (
            <li className={styles.listItem}>
              <span className={styles.listItemText}>No notifications.</span>
            </li>
          )}
          {notifications.map((item) => {
            const isRead = item.isRead ?? item.read ?? false
            return (
              <li
                key={item.id}
                className={`${styles.listItem} ${isRead ? styles.listItemRead : ''} ${markingId === item.id ? styles.listItemPending : ''}`}
                onClick={() => !isRead && handleMarkAsRead(item.id)}
                aria-busy={markingId === item.id}
              >
                <div className={styles.notificationContent}>
                  <div className={styles.notificationTitle}>
                    {!isRead && <span className={styles.unreadDot} />}
                    <strong>{item.title}</strong>
                    {item.createdAt && <time>{formatDate(item.createdAt)}</time>}
                  </div>
                  <span className={styles.listItemText}>{item.message}</span>
                  {item.targetUrl && (
                    <Link
                      className={styles.notificationLink}
                      to={item.targetUrl}
                      onClick={(event) => event.stopPropagation()}
                    >
                      View details
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default NotificationsPage
