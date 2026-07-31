import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
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
  followJournal,
  getFollowedJournals,
  unfollowJournal,
} from '../../services/followService'
import { getJournalById } from '../../services/journalService'
import styles from './journalDetailPage.module.css'

function formatPeriod(point) {
  if (!point.month) return String(point.year)
  return `${String(point.month).padStart(2, '0')}/${point.year}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function JournalDetailPage() {
  const { journalId } = useParams()
  const navigate = useNavigate()
  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')

  useEffect(() => {
    async function fetchJournal() {
      setLoading(true)
      setError('')
      setFollowError('')
      setIsFollowing(false)
      try {
        const hasToken = Boolean(localStorage.getItem('token'))
        const journalResult = await getJournalById(journalId)
        setJournal(journalResult)

        if (hasToken) {
          try {
            const followedResult = await getFollowedJournals({ page: 1, pageSize: 1000 })
            const followedJournals = followedResult?.items ?? []
            setIsFollowing(
              followedJournals.some((item) => Number(item.id) === Number(journalId)),
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
        setError(err.response?.data?.message || err.message || 'Failed to load journal details.')
        setJournal(null)
      } finally {
        setLoading(false)
      }
    }

    fetchJournal()
  }, [journalId])

  const handleFollowToggle = async () => {
    setFollowLoading(true)
    setFollowError('')
    try {
      if (isFollowing) {
        await unfollowJournal(journalId)
        setIsFollowing(false)
      } else {
        await followJournal(journalId)
        setIsFollowing(true)
      }
    } catch (err) {
      setFollowError(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${isFollowing ? 'unfollow' : 'follow'} journal.`,
      )
    } finally {
      setFollowLoading(false)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/search')
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          <span aria-hidden="true">&larr;</span>
          Back
        </button>
        <Skeleton variant="title" width="45%" />
        <div className={styles.loadingChart}><Skeleton variant="chart" /></div>
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error || !journal) {
    return (
      <section className={styles.page}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          <span aria-hidden="true">&larr;</span>
          Back
        </button>
        <div className={styles.errorState}>
          <strong>Journal could not be loaded</strong>
          <p>{error}</p>
          <Link to="/trends">Back to trends</Link>
        </div>
      </section>
    )
  }

  // Filter out leading zeros so the chart starts from the first active period
  let activeStartIndex = (journal.trendChart ?? []).findIndex(
    (point) => (point.paperCount ?? 0) > 0 || (point.citationCount ?? 0) > 0
  )
  if (activeStartIndex === -1) activeStartIndex = 0

  const trendData = (journal.trendChart ?? []).slice(activeStartIndex).map((point) => ({
    ...point,
    period: formatPeriod(point),
  }))

  return (
    <section className={styles.page}>
      <div>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          <span aria-hidden="true">&larr;</span>
          Back
        </button>
      </div>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Academic journal</span>
          <h1>{journal.name}</h1>
          <div className={styles.metadata}>
            {journal.publisher && <span>{journal.publisher}</span>}
            {journal.issn && <span>ISSN {journal.issn}</span>}
            {journal.website && (
              <a href={journal.website} target="_blank" rel="noreferrer">
                Official website
              </a>
            )}
          </div>
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
                : isFollowing ? 'Unfollow journal' : 'Follow journal'}
            </button>
          ) : (
            <Link className={styles.followButton} to="/login">Sign in to follow</Link>
          )}
          <Link
            className={styles.primaryLink}
            to={`/search/results?journalId=${journal.id}&journalName=${encodeURIComponent(journal.name)}&page=1&pageSize=10`}
          >
            View all papers
          </Link>
        </div>
      </header>

      {followError && <p className={styles.followError}>{followError}</p>}

      <div className={styles.statsGrid}>
        <article>
          <span>Papers</span>
          <strong>{formatNumber(journal.paperCount)}</strong>
        </article>
        <article>
          <span>Impact factor</span>
          <strong>{Number(journal.impactFactor).toFixed(2)}</strong>
        </article>
        <article>
          <span>H-index</span>
          <strong>{formatNumber(journal.hIndex)}</strong>
        </article>
        <article>
          <span>Trend periods</span>
          <strong>{formatNumber(trendData.length)}</strong>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Journal performance</span>
            <h2>Publication and citation trend</h2>
          </div>
        </div>
        <div className={styles.chart}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis yAxisId="papers" stroke="#1e40af" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis yAxisId="citations" orientation="right" stroke="#0891b2" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="papers" type="monotone" dataKey="paperCount" name="Papers" stroke="#1e40af" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="citations" type="monotone" dataKey="citationCount" name="Citations" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>No trend data is available for this journal.</p>
          )}
        </div>
      </article>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Latest research</span>
            <h2>Recent papers</h2>
          </div>
          <span>{journal.recentPapers.length} shown</span>
        </div>
        <SearchResultsList papers={journal.recentPapers} />
      </section>
    </section>
  )
}

export default JournalDetailPage
