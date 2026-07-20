import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import {
  getNotificationSettings,
  getNotifications,
  markAllAsRead,
  markAsRead,
  updateNotificationSettings,
} from '../../services/notificationService'
import styles from './simpleListPage.module.css'

const PAGE_SIZE = 10
const NOTIFICATION_FETCH_LIMIT = 100

function formatDate(value) {
  let dateString = value;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    dateString += 'Z';
  }
  const date = dateString ? new Date(dateString) : null
  if (!date || Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function NotificationsPage() {
  const role = localStorage.getItem('userRole')
  const isAdmin = role === 'Admin'
  const [notificationType, setNotificationType] = useState('User')
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState(null)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingId, setMarkingId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      setSettingsLoading(true)
      setSettingsError('')
      try {
        setSettings(await getNotificationSettings())
      } catch (err) {
        setSettingsError(
          err.response?.data?.message || err.message || 'Failed to load notification settings.',
        )
        setSettings(null)
      } finally {
        setSettingsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSettingChange = (field) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value

    setSettings((current) => ({ ...current, [field]: value }))
    setSettingsError('')
    setSettingsMessage('')
  }

  const handleSaveSettings = async (event) => {
    event.preventDefault()
    if (!settings || settingsSaving) return

    setSettingsSaving(true)
    setSettingsError('')
    setSettingsMessage('')
    try {
      setSettings(await updateNotificationSettings(settings))
      setSettingsMessage('Notification settings saved.')
    } catch (err) {
      setSettingsError(
        err.response?.data?.message || err.message || 'Failed to update notification settings.',
      )
    } finally {
      setSettingsSaving(false)
    }
  }

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true)
      setError('')
      try {
        const result = await getNotifications({
          isRead: filter === 'all' ? undefined : filter === 'read',
          limit: NOTIFICATION_FETCH_LIMIT,
          type: notificationType === 'Admin' ? 'Admin' : 'User'
        })
        setNotifications(result)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load notifications')
        setNotifications([])
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    }

    fetchNotifications()
  }, [filter, notificationType])

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageNotifications = useMemo(
    () => notifications.slice(startIndex, startIndex + PAGE_SIZE),
    [notifications, startIndex],
  )
  const firstResult = notifications.length > 0 ? startIndex + 1 : 0
  const lastResult = Math.min(startIndex + pageNotifications.length, notifications.length)

  const handleFilterChange = (value) => {
    setFilter(value)
    setPage(1)
  }

  const handlePageChange = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateNotificationReadState = (notificationId, notifyHeader = true) => {
    setNotifications((current) =>
      filter === 'unread'
        ? current.filter((item) => item.id !== notificationId)
        : current.map((item) => (
          item.id === notificationId
            ? { ...item, isRead: true, read: true, readAt: new Date().toISOString() }
            : item
        )),
    )
    if (notifyHeader) {
      window.dispatchEvent(new Event('notifications-updated'))
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    if (markingId === notificationId) return

    setMarkingId(notificationId)
    setError('')
    try {
      await markAsRead(notificationId)
      updateNotificationReadState(notificationId)
    } catch {
      setError('Failed to mark notification as read.')
    } finally {
      setMarkingId(null)
    }
  }

  const handleOpenNotification = (event, item, isRead) => {
    event.stopPropagation()
    if (isRead || markingId === item.id) return

    updateNotificationReadState(item.id, false)
    markAsRead(item.id)
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new Event('notifications-updated'))
      })
  }

  const handleMarkAllAsRead = async () => {
    if (markingAll) return

    setMarkingAll(true)
    setError('')
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
    } finally {
      setMarkingAll(false)
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
          disabled={loading || markingAll || notifications.every((item) => item.isRead)}
        >
          {markingAll ? 'Marking...' : 'Mark all read'}
        </button>
      </div>

      {isAdmin && (
        <div className={styles.typeTabs}>
          <button
            type="button"
            className={notificationType === 'User' ? styles.typeTabActive : styles.typeTab}
            onClick={() => { setNotificationType('User'); setPage(1); }}
          >
            Personal
          </button>
          <button
            type="button"
            className={notificationType === 'Admin' ? styles.typeTabActive : styles.typeTab}
            onClick={() => { setNotificationType('Admin'); setPage(1); }}
          >
            System / Admin
          </button>
        </div>
      )}

      <div className={styles.listToolbar}>
        <div className={styles.filterTabs}>
          {['all', 'unread', 'read'].map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterTab} ${filter === value ? styles.filterTabActive : ''}`}
              onClick={() => handleFilterChange(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.settingsPanel}>
        <div className={styles.settingsHeader}>
          <div>
            <span>Preferences</span>
            <h2>Notification settings</h2>
          </div>
        </div>
        {settingsLoading ? (
          <Skeleton variant="text" count={3} />
        ) : settingsError && !settings ? (
          <p className={styles.listError}>{settingsError}</p>
        ) : settings ? (
          <form className={styles.settingsForm} onSubmit={handleSaveSettings}>
            <div className={styles.settingsGrid}>
              <label className={styles.settingToggle}>
                <span>
                  <strong>Email notifications</strong>
                  <small>Receive research updates by email.</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={handleSettingChange('emailEnabled')}
                  disabled={settingsSaving}
                />
              </label>
              <label className={styles.settingToggle}>
                <span>
                  <strong>Topic alerts</strong>
                  <small>Get alerts for followed research topics.</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.topicAlertEnabled}
                  onChange={handleSettingChange('topicAlertEnabled')}
                  disabled={settingsSaving}
                />
              </label>
              <label className={styles.frequencyField}>
                <span>Frequency</span>
                <input
                  type="text"
                  list="notification-frequency-options"
                  value={settings.frequency}
                  onChange={handleSettingChange('frequency')}
                  disabled={settingsSaving}
                  required
                />
                <datalist id="notification-frequency-options">
                  <option value="Immediate" />
                  <option value="Daily" />
                  <option value="Weekly" />
                </datalist>
              </label>
            </div>
            <div className={styles.settingsActions}>
              {settingsError && <span className={styles.settingsSaveError}>{settingsError}</span>}
              {settingsMessage && <span className={styles.settingsSuccess}>{settingsMessage}</span>}
              <button type="submit" disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {error && <p className={styles.listError}>{error}</p>}

      {initialLoad ? (
        <Skeleton variant="card" count={3} />
      ) : (
        <ul className={styles.list}>
          {notifications.length === 0 && (
            <li className={styles.listItem}>
              <span className={styles.listItemText}>No notifications.</span>
            </li>
          )}
          {pageNotifications.map((item) => {
            const isRead = item.isRead ?? item.read ?? false
            const targetUrl = item.targetUrl
            const notificationBody = (
              <>
                <div className={styles.notificationTitle}>
                  {!isRead && <span className={styles.unreadDot} />}
                  <strong>{item.title}</strong>
                  {item.createdAt && <time>{formatDate(item.createdAt)}</time>}
                </div>
                <span className={styles.listItemText}>{item.message}</span>
              </>
            )

            return (
              <li
                key={item.id}
                className={`${styles.listItem} ${isRead ? styles.listItemRead : ''} ${markingId === item.id ? styles.listItemPending : ''}`}
                onClick={() => !isRead && handleMarkAsRead(item.id)}
                aria-busy={markingId === item.id}
              >
                <div className={styles.notificationContent}>
                  {targetUrl ? (
                    <Link
                      className={styles.notificationMainLink}
                      to={targetUrl}
                      onClick={(event) => handleOpenNotification(event, item, isRead)}
                    >
                      {notificationBody}
                    </Link>
                  ) : (
                    notificationBody
                  )}
                  {targetUrl && (
                    <Link
                      className={styles.notificationLink}
                      to={targetUrl}
                      onClick={(event) => handleOpenNotification(event, item, isRead)}
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
      {!loading && notifications.length > PAGE_SIZE && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </section>
  )
}

export default NotificationsPage
