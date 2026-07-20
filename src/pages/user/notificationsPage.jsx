import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Skeleton from '../../components/Skeleton'
import {
  getNotificationSettings,
  getNotifications,
  markAllAsRead,
  markAsRead,
  updateNotificationSettings,
} from '../../services/notificationService'
import styles from './simpleListPage.module.css'

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
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState(null)
  const [filter, setFilter] = useState('all')
  const [limit, setLimit] = useState('20')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingId, setMarkingId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

      <section className={styles.settingsPanel}>
        <div className={styles.settingsHeader}>
          <div>
            <span>Preferences</span>
            <h2>Notification settings</h2>
          </div>
          <small>Manage delivery preferences</small>
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

      {loading && notifications.length === 0 ? (
        <Skeleton variant="card" count={3} />
      ) : (
        <ul className={styles.list} style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
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
