import { useEffect, useState } from 'react'
import StatsCard from '../../components/StatsCard'
import { getAdminStats } from '../../services/adminService'
import styles from './adminDashboardPage.module.css'

function AdminDashboardPage() {
  const [adminStats, setAdminStats] = useState([])
  const [syncInfo, setSyncInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        const result = await getAdminStats()
        // Convert stats object into array for StatsCard
        if (result) {
          const { lastSync, systemHealth, ...stats } = result
          const statsArr = Object.entries(stats).map(([key, value]) => ({
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
            value: String(value),
          }))
          setAdminStats(statsArr)
          setSyncInfo({ lastSync: lastSync ?? 'N/A', systemHealth: systemHealth ?? 'Healthy' })
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin stats')
        setAdminStats([])
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <section className={styles.dashboardPage}>
        <p>Loading...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.dashboardPage}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.dashboardPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Admin Dashboard</h1>
        <p className={styles.pageSubtitle}>System overview and monitoring</p>
      </div>
      <div className={styles.statsGrid}>
        {adminStats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
      <article className={styles.syncPanel}>
        <h2 className={styles.syncTitle}>Sync Status</h2>
        <p className={styles.syncInfo}>
          Last successful metadata sync: {syncInfo?.lastSync ?? 'N/A'}
        </p>
        <p className={styles.healthy}>
          ✓ System Health: {syncInfo?.systemHealth ?? 'Healthy'}
        </p>
      </article>
    </section>
  )
}

export default AdminDashboardPage
