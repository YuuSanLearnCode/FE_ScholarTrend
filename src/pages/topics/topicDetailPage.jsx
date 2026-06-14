import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import SearchResultsList from '../../components/SearchResultsList'
import Skeleton from '../../components/Skeleton'
import {
  followTopic,
  getFollowedTopics,
  unfollowTopic,
} from '../../services/followService'
import { getTopicById } from '../../services/topicService'
import styles from './topicDetailPage.module.css'

function formatPeriod(point) {
  if (!point.month) return String(point.year)
  return `${String(point.month).padStart(2, '0')}/${point.year}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function TopicDetailPage() {
  const { topicId } = useParams()
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')

  useEffect(() => {
    async function fetchTopic() {
      setLoading(true)
      setError('')
      setFollowError('')
      setIsFollowing(false)
      try {
        const hasToken = Boolean(localStorage.getItem('token'))
        const topicResult = await getTopicById(topicId)
        setTopic(topicResult)

        if (hasToken) {
          try {
            const followedTopics = await getFollowedTopics()
            setIsFollowing(
              followedTopics.some((item) => Number(item.id) === Number(topicId)),
            )
          } catch (followErr) {
            setFollowError(
              followErr.response?.data?.message ||
                followErr.message ||
                'Could not load follow status.',
            )
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load topic details.')
        setTopic(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTopic()
  }, [topicId])

  const handleFollowToggle = async () => {
    setFollowLoading(true)
    setFollowError('')
    try {
      if (isFollowing) {
        await unfollowTopic(topicId)
        setIsFollowing(false)
      } else {
        await followTopic(topicId)
        setIsFollowing(true)
      }
    } catch (err) {
      setFollowError(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${isFollowing ? 'unfollow' : 'follow'} topic.`,
      )
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="45%" />
        <div className={styles.loadingChart}><Skeleton variant="chart" /></div>
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error || !topic) {
    return (
      <section className={styles.page}>
        <div className={styles.errorState}>
          <strong>Topic could not be loaded</strong>
          <p>{error}</p>
          <Link to="/trends">Back to trends</Link>
        </div>
      </section>
    )
  }

  const trendData = topic.trendChart.map((point) => ({
    ...point,
    period: formatPeriod(point),
  }))
  const totalCitations = trendData.reduce(
    (sum, point) => sum + (point.citationCount ?? 0),
    0,
  )
  const averageGrowth = trendData.length
    ? trendData.reduce((sum, point) => sum + (point.growthRate ?? 0), 0) / trendData.length
    : 0
  const peakScore = Math.max(0, ...trendData.map((point) => point.trendingScore ?? 0))

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Research topic</span>
          <h1>{topic.name}</h1>
          <p>{topic.description || 'No description is available for this topic.'}</p>
        </div>
        <div className={styles.heroActions}>
          {localStorage.getItem('token') ? (
            <button
              type="button"
              className={`${styles.followButton} ${isFollowing ? styles.followingButton : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading
                ? isFollowing ? 'Unfollowing...' : 'Following...'
                : isFollowing ? 'Unfollow topic' : 'Follow topic'}
            </button>
          ) : (
            <Link className={styles.followButton} to="/login">Sign in to follow</Link>
          )}
          <Link
            className={styles.primaryLink}
            to={`/search/results?topicId=${topic.id}&topicName=${encodeURIComponent(topic.name)}&page=1&pageSize=10`}
          >
            View all papers
          </Link>
        </div>
      </header>

      {followError && <p className={styles.followError}>{followError}</p>}

      <div className={styles.statsGrid}>
        <article>
          <span>Papers</span>
          <strong>{formatNumber(topic.paperCount)}</strong>
        </article>
        <article>
          <span>Citations</span>
          <strong>{formatNumber(totalCitations)}</strong>
        </article>
        <article>
          <span>Average growth</span>
          <strong>{averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%</strong>
        </article>
        <article>
          <span>Peak trend score</span>
          <strong>{peakScore.toFixed(2)}</strong>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Topic performance</span>
            <h2>Publication and citation trend</h2>
          </div>
        </div>
        <div className={styles.chart}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                <Line type="monotone" dataKey="paperCount" name="Papers" stroke="#1e40af" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="citationCount" name="Citations" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>No trend data is available for this topic.</p>
          )}
        </div>
      </article>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Latest research</span>
            <h2>Recent papers</h2>
          </div>
          <span>{topic.recentPapers.length} shown</span>
        </div>
        <SearchResultsList papers={topic.recentPapers} />
      </section>
    </section>
  )
}

export default TopicDetailPage
