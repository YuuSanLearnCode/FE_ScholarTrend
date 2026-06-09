import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatsCard from '../components/StatsCard'
import Skeleton from '../components/Skeleton'
import { getTrendOverview, getKeywordTrends, getTopicTrends } from '../services/trendService'
import styles from './dashboardPage.module.css'

const quickActions = [
  { label: 'Search Papers', path: '/search' },
  { label: 'View Trends', path: '/trends' },
  { label: 'Bookmarks', path: '/bookmarks' },
  { label: 'Profile', path: '/profile' },
]

function DashboardPage() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || 'Researcher'
  const [quickStats, setQuickStats] = useState([])
  const [keywordData, setKeywordData] = useState([])
  const [topicData, setTopicData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [overview, keywords, topics] = await Promise.all([
          getTrendOverview(),
          getKeywordTrends(),
          getTopicTrends(),
        ])

        if (overview) {
          const statsArr = Object.entries(overview).map(([key, value]) => ({
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
            value: String(value),
          }))
          setQuickStats(statsArr)
        }

        if (Array.isArray(keywords)) {
          setKeywordData(keywords.map((k) => ({
            name: k.keyword || k.name || k.topic || String(k),
            value: k.count || k.publications || 0,
          })))
        }

        if (Array.isArray(topics)) {
          setTopicData(topics.map((t) => ({
            name: t.name || t.topic || String(t),
            value: t.count || t.publications || 0,
          })))
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <section className={styles.dashboard}>
        <Skeleton variant="title" width="60%" />
        <div className={styles.statsGrid}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
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
          <StatsCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      {/* Quick Actions */}
      <article className={styles.panel}>
        <h2 className={styles.panelTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <button key={action.label} className={styles.actionBtn} onClick={() => navigate(action.path)}>
              <span className={styles.actionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </article>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Top Keywords Chart */}
        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Top Keywords</h2>
          <div className={styles.chartWrapSmall}>
            {keywordData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyText}>No data available.</p>
            )}
          </div>
        </article>

        {/* Trending Topics */}
        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Trending Topics</h2>
          <div className={styles.topicsGrid}>
            {topicData.length > 0 ? (
              topicData.map((t) => (
                <span key={t.name} className={styles.topicPill}>
                  {t.name}
                </span>
              ))
            ) : (
              <p className={styles.emptyText}>No data available.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}

export default DashboardPage
