import { useState } from 'react'
import styles from './adminApiConfigPage.module.css'

function AdminApiConfigPage() {
  const [config, setConfig] = useState({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.scholartrend.local',
    apiKey: '',
    syncInterval: '24',
  })
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <section className={styles.panel}>
      <h1>Admin API Configuration</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="api-base-url">API Base URL</label>
        <input
          id="api-base-url"
          className={styles.input}
          value={config.baseUrl}
          onChange={(event) => {
            setSaved(false)
            setConfig((prev) => ({ ...prev, baseUrl: event.target.value }))
          }}
        />

        <label htmlFor="api-key">API Key</label>
        <input
          id="api-key"
          className={styles.input}
          type="password"
          value={config.apiKey}
          onChange={(event) => {
            setSaved(false)
            setConfig((prev) => ({ ...prev, apiKey: event.target.value }))
          }}
        />

        <label htmlFor="api-sync">Sync Interval (hours)</label>
        <input
          id="api-sync"
          className={styles.input}
          type="number"
          min="1"
          value={config.syncInterval}
          onChange={(event) => {
            setSaved(false)
            setConfig((prev) => ({ ...prev, syncInterval: event.target.value }))
          }}
        />

        <button type="submit" className={styles.button}>
          Save Configuration
        </button>
      </form>
      {saved && <p className={styles.saved}>Configuration saved.</p>}
    </section>
  )
}

export default AdminApiConfigPage
