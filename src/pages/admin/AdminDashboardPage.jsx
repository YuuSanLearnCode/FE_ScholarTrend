import StatsCard from '../../components/StatsCard'
import styles from './adminDashboardPage.module.css'

const adminStats = [
  { label: 'Total Users', value: '1,248' },
  { label: 'Active Sessions', value: '312' },
  { label: 'Queued Sync Jobs', value: '7' },
]

function AdminDashboardPage() {
  return (
    <section>
      <h1>Admin Dashboard</h1>
      <div className={styles.statsGrid}>
        {adminStats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
      <article className={styles.syncPanel}>
        <h2>Sync Status</h2>
        <p>Last successful metadata sync: 2026-06-02 21:10 UTC</p>
        <p className={styles.healthy}>System Health: Healthy</p>
      </article>
    </section>
  )
}

export default AdminDashboardPage
