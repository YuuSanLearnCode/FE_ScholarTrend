import StatsCard from '../components/StatsCard'
import { quickStats, trendingTopics } from '../data/mockData'
import styles from './dashboardPage.module.css'

function DashboardPage() {
  return (
    <section>
      <h1>User Dashboard</h1>
      <div className={styles.statsGrid}>
        {quickStats.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
      <article className={styles.panel}>
        <h2>Trending Topics Overview</h2>
        <ul>
          {trendingTopics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      </article>
    </section>
  )
}

export default DashboardPage
