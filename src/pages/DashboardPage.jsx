import { useEffect, useState } from 'react'
import StatsCard from '../components/StatsCard'
import { getTrendOverview, getKeywordTrends } from '../services/trendService'
import styles from './dashboardPage.module.css'

const quickActions = [
  { label: 'Search Papers' },
  { label: 'View Trends' },
  { label: 'Bookmarks' },
  { label: 'Settings' },
]

function DashboardPage() {
  const userName = localStorage.getItem('userName') || 'Researcher'
  const [quickStats, setQuickStats] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [overview, keywords] = await Promise.all([
          getTrendOverview(),
          getKeywordTrends(),
        ])

        // Convert overview object to stats array for StatsCard
        if (overview) {
          const statsArr = Object.entries(overview).map(([key, value]) => ({
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
            value: String(value),
          }))
          setQuickStats(statsArr)
        }

        // Keywords could be an array of strings or objects
        if (Array.isArray(keywords)) {
          setTrendingTopics(
            keywords.map((k) => (typeof k === 'string' ? k : k.keyword || k.name || k.topic || ''))
          )
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data')
        setQuickStats([])
        setTrendingTopics([])
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <section className={styles.dashboard}>
        <p>Loading...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.dashboard}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.dashboard}>
      {/* Welcome Header */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>
          Welcome back, <span className={styles.nameHighlight}>{userName}</span>
        </h1>
        <p className={styles.welcomeSubtitle}>
          Here&apos;s what&apos;s happening in your research world today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {quickStats.map((item) => (
          <StatsCard
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <article className={styles.panel}>
        <h2 className={styles.panelTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <button key={action.label} className={styles.actionBtn}>
              <span className={styles.actionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </article>

      {/* Trending Topics */}
      <article className={styles.panel}>
        <h2 className={styles.panelTitle}>Trending Topics</h2>
        <div className={styles.topicsGrid}>
          {trendingTopics.map((topic) => (
            <span key={topic} className={styles.topicPill}>
              {topic}
            </span>
          ))}
        </div>
      </article>
    </section>
  )
}

export default DashboardPage
