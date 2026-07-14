import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
import { getPersonalDashboard, getDashboardOverview } from '../services/dashboardService'
import styles from './DashboardPage.module.css'

const quickActions = [
  { label: 'Search Papers', path: '/search' },
  { label: 'View Trends', path: '/trends' },
  { label: 'Bookmarks', path: '/bookmarks' },
  { label: 'Profile', path: '/profile' },
]

function DashboardPage() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('userName') || 'Researcher'
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [overviewData, setOverviewData] = useState(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [personal, overview] = await Promise.all([
          getPersonalDashboard(),
          getDashboardOverview().catch(() => null)
        ])
        setDashboardData(personal)
        if (overview) setOverviewData(overview)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data')
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

  const quickStats = [
    { label: 'Bookmarks', value: dashboardData?.bookmarkCount ?? 0 },
    { label: 'Followed Topics', value: dashboardData?.followedTopicsCount ?? 0 },
    { label: 'Followed Journals', value: dashboardData?.followedJournalsCount ?? 0 },
    { label: 'Unread Notifications', value: dashboardData?.unreadNotifications ?? 0 },
  ]
  const recommendedTopics = dashboardData?.recommendedTopics ?? []
  const chartData = recommendedTopics.map((topic) => ({
    name: topic.name,
    citations: topic.citationCount ?? 0,
  }))
  const recentBookmarks = dashboardData?.recentBookmarks ?? []
  const recentNotifications = dashboardData?.recentNotifications ?? []

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
          <StatsCard key={item.label} label={item.label} value={String(item.value)} />
        ))}
      </div>

      {overviewData && (
        <article className={styles.panel} style={{ marginTop: '1.25rem' }}>
          <h2 className={styles.panelTitle}>Platform Overview</h2>
          <div className={styles.statsGrid} style={{ marginBottom: 0, marginTop: '1rem' }}>
            <StatsCard label="Total Authors" value={overviewData.totalAuthors ?? 0} />
            <StatsCard label="Total Papers" value={overviewData.totalPapers ?? 0} />
            <StatsCard label="Tracked Topics" value={overviewData.totalTopics ?? 0} />
            <StatsCard label="Tracked Journals" value={overviewData.totalJournals ?? 0} />
          </div>
        </article>
      )}

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
        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Recommended Topic Citations</h2>
          <div className={styles.chartWrapSmall}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                  <Bar dataKey="citations" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyText}>No recommended topics yet.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <h2 className={styles.panelTitle}>Recommended Topics</h2>
          <div className={styles.recommendedList}>
            {recommendedTopics.length > 0 ? (
              recommendedTopics.map((topic) => (
                <Link
                  key={topic.id}
                  to={topic.id
                    ? `/topics/${encodeURIComponent(topic.id)}`
                    : `/search/results?keyword=${encodeURIComponent(topic.name)}&page=1&pageSize=10`}
                  className={styles.recommendedItem}
                >
                  <span>
                    <strong>{topic.name}</strong>
                    <small>{topic.paperCount} papers · {topic.citationCount} citations</small>
                  </span>
                  <span className={styles.topicScore}>
                    {Number(topic.trendingScore ?? 0).toFixed(2)}
                  </span>
                </Link>
              ))
            ) : (
              <p className={styles.emptyText}>No recommended topics yet.</p>
            )}
          </div>
        </article>
      </div>

      <div className={styles.activityRow}>
        <article className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2 className={styles.panelTitle}>Recent Bookmarks</h2>
            <Link to="/bookmarks" className={styles.viewAll}>View all</Link>
          </div>
          <div className={styles.activityList}>
            {recentBookmarks.length > 0 ? (
              recentBookmarks.map((bookmark) => (
                <Link
                  key={bookmark.id}
                  to={`/papers/${bookmark.paperId}`}
                  className={styles.activityItem}
                >
                  <strong>{bookmark.title}</strong>
                  <span>
                    {bookmark.journalName || 'Unknown journal'}
                    {bookmark.publicationYear ? ` · ${bookmark.publicationYear}` : ''}
                  </span>
                </Link>
              ))
            ) : (
              <p className={styles.emptyText}>You have no recent bookmarks.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2 className={styles.panelTitle}>Recent Notifications</h2>
            <Link to="/notifications" className={styles.viewAll}>View all</Link>
          </div>
          <div className={styles.activityList}>
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.targetUrl || '/notifications'}
                  className={styles.activityItem}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </Link>
              ))
            ) : (
              <p className={styles.emptyText}>You have no recent notifications.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}

export default DashboardPage
