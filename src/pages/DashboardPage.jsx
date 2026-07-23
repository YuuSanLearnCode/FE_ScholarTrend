import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function DashboardPage() {
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
          getDashboardOverview().catch(() => null),
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
        <div className={styles.loadingHero}>
          <Skeleton variant="title" width="52%" />
          <Skeleton variant="text" width="36%" />
        </div>
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
        <div className={styles.errorState}>
          <strong>Dashboard could not be loaded</strong>
          <p>{error}</p>
        </div>
      </section>
    )
  }

  const quickStats = [
    {
      label: 'Bookmarks',
      value: dashboardData?.bookmarkCount ?? 0,
      detail: 'Saved papers',
      tone: 'blue',
    },
    {
      label: 'Followed Topics',
      value: dashboardData?.followedTopicsCount ?? 0,
      detail: 'Research areas',
      tone: 'cyan',
    },
    {
      label: 'Followed Journals',
      value: dashboardData?.followedJournalsCount ?? 0,
      detail: 'Tracked journals',
      tone: 'green',
    },
  ]
  const overviewStats = overviewData
    ? [
        { label: 'Total Authors', value: overviewData.totalAuthors ?? 0 },
        { label: 'Total Papers', value: overviewData.totalPapers ?? 0 },
        { label: 'Tracked Topics', value: overviewData.totalTopics ?? 0 },
        { label: 'Tracked Journals', value: overviewData.totalJournals ?? 0 },
      ]
    : []
  const recommendedTopics = dashboardData?.recommendedTopics ?? []
  const chartData = recommendedTopics.map((topic) => ({
    name: topic.name,
    citations: topic.citationCount ?? 0,
  }))
  const recentBookmarks = dashboardData?.recentBookmarks ?? []
  const recentNotifications = dashboardData?.recentNotifications ?? []

  return (
    <section className={styles.dashboard}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Research workspace</span>
          <h1>
            Welcome back, <span>{userName}</span>
          </h1>
          <p>Follow your saved papers, topic momentum, and research alerts in one clean view.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} to="/search">
              Search papers
            </Link>
            <Link className={styles.secondaryAction} to="/trends">
              View trends
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {quickStats.map((item) => (
          <StatsCard
            key={item.label}
            label={item.label}
            value={formatNumber(item.value)}
            detail={item.detail}
            tone={item.tone}
          />
        ))}
      </div>

      {overviewData && (
        <article className={`${styles.panel} ${styles.overviewPanel}`}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>Live index</span>
              <h2 className={styles.panelTitle}>Platform overview</h2>
            </div>
          </div>
          <div className={styles.overviewGrid}>
            {overviewStats.map((item) => (
              <div key={item.label} className={styles.overviewItem}>
                <span>{item.label}</span>
                <strong>{formatNumber(item.value)}</strong>
              </div>
            ))}
          </div>
        </article>
      )}

      <div className={styles.chartsRow}>
        <article className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>Citations</span>
              <h2 className={styles.panelTitle}>Recommended topics</h2>
            </div>
          </div>
          <div className={styles.chartWrapSmall}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 6, right: 18, left: 10, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#cbd5e1"
                    tick={{ fill: '#475569', fontSize: 11 }}
                    width={118}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="citations" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyText}>No recommended topics yet.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <span className={styles.panelEyebrow}>Topics</span>
              <h2 className={styles.panelTitle}>What to follow next</h2>
            </div>
          </div>
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
                    <small>
                      {formatNumber(topic.paperCount)} papers / {formatNumber(topic.citationCount)} citations
                    </small>
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
            <div>
              <span className={styles.panelEyebrow}>Saved</span>
              <h2 className={styles.panelTitle}>Recent bookmarks</h2>
            </div>
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
                    {bookmark.publicationYear ? ` / ${bookmark.publicationYear}` : ''}
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
            <div>
              <span className={styles.panelEyebrow}>Updates</span>
              <h2 className={styles.panelTitle}>Recent notifications</h2>
            </div>
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
