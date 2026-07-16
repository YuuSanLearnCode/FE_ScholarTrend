import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFollowCounts,
  getFollowedAuthors,
  getFollowedJournals,
  getFollowedPapers,
  getFollowedTopics,
  unfollowAuthor,
  unfollowJournal,
  unfollowPaper,
  unfollowTopic,
} from '../../services/followService'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import styles from './simpleListPage.module.css'

const FOLLOW_TYPES = [
  { key: 'Topic', label: 'Topics', singular: 'Topic', fetcher: getFollowedTopics },
  { key: 'Author', label: 'Authors', singular: 'Author', fetcher: getFollowedAuthors },
  { key: 'Paper', label: 'Papers', singular: 'Paper', fetcher: getFollowedPapers },
  { key: 'Journal', label: 'Journals', singular: 'Journal', fetcher: getFollowedJournals },
]

const FOLLOW_CONFIG = {
  Topic: {
    route: (id) => `/topics/${encodeURIComponent(id)}`,
    unfollow: unfollowTopic,
  },
  Author: {
    route: (id) => `/authors/id/${encodeURIComponent(id)}`,
    unfollow: unfollowAuthor,
  },
  Paper: {
    route: (id) => `/papers/${encodeURIComponent(id)}`,
    unfollow: unfollowPaper,
  },
  Journal: {
    route: (id) => `/journals/${encodeURIComponent(id)}`,
    unfollow: unfollowJournal,
  },
}

function formatFollowedAt(value) {
  if (!value) return 'Followed recently'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Followed recently'

  return `Followed ${new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)}`
}

function FollowingPage() {
  const [items, setItems] = useState([])
  const [activeType, setActiveType] = useState('Topic')
  const [counts, setCounts] = useState({ Topic: 0, Author: 0, Journal: 0, Paper: 0, All: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pendingKey, setPendingKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const pageSize = 10

  useEffect(() => {
    async function fetchCounts() {
      try {
        const countsData = await getFollowCounts()
        setCounts({
          Topic: countsData.topicsCount ?? 0,
          Author: countsData.authorsCount ?? 0,
          Journal: countsData.journalsCount ?? 0,
          Paper: countsData.papersCount ?? 0,
          All: (countsData.topicsCount ?? 0) + (countsData.authorsCount ?? 0) + (countsData.journalsCount ?? 0) + (countsData.papersCount ?? 0)
        })
      } catch (err) {
        console.error('Failed to load counts:', err)
      }
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    async function fetchFollowing() {
      setLoading(true)
      setError('')
      try {
        const currentTypeConfig = FOLLOW_TYPES.find(t => t.key === activeType)
        const result = await currentTypeConfig.fetcher({ page, pageSize })
        
        setItems(result.items ?? [])
        setTotalPages(result.totalPages || 1)
      } catch (err) {
        setError(err.response?.data?.message || `Failed to load ${activeType.toLowerCase()}s`)
        setItems([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowing()
  }, [activeType, page])

  const handleTypeChange = (newType) => {
    setActiveType(newType)
    setPage(1)
    setSearchTerm('')
  }

  const handleUnfollow = async (item) => {
    const config = FOLLOW_CONFIG[item.type]
    if (!config) return

    const itemKey = `${item.type}-${item.id}`
    setPendingKey(itemKey)
    setActionError('')

    try {
      await config.unfollow(item.id)
      setItems((prev) => prev.filter((current) => (
        current.type !== item.type || String(current.id) !== String(item.id)
      )))
      
      setCounts((prev) => ({
        ...prev,
        [item.type]: Math.max(0, prev[item.type] - 1),
        All: Math.max(0, prev.All - 1)
      }))
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.message ||
          `Failed to unfollow ${item.type.toLowerCase()}.`,
      )
    } finally {
      setPendingKey('')
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleItems = items.filter((item) => {
    const matchesSearch = !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.type.toLowerCase().includes(normalizedSearch)

    return matchesSearch
  })

  const summaryItems = [
    { label: 'Total following', value: counts.All },
    ...FOLLOW_TYPES.map((type) => ({
      label: type.label,
      value: counts[type.key]
    }))
  ]

  return (
    <section className={styles.panel}>
      <div className={styles.followingHero}>
        <div>
          <h1 className={styles.pageTitle}>My Following</h1>
          <p className={styles.pageSubtitle}>Everything this user follows is grouped here.</p>
        </div>
        <span className={styles.totalBadge}>{counts.All} followed</span>
      </div>

      <section className={styles.summaryGrid} aria-label="Following summary">
        {summaryItems.map((item) => (
          <article key={item.label} className={styles.summaryCard}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <div className={styles.followingToolbar}>
        <div className={styles.followTabs} aria-label="Filter followed items">
          {FOLLOW_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              className={activeType === type.key ? styles.followTabActive : styles.followTab}
              onClick={() => handleTypeChange(type.key)}
            >
              {type.label}
              <span>{counts[type.key]}</span>
            </button>
          ))}
        </div>
        <label className={styles.followingSearch} htmlFor="following-search">
          <span>Search</span>
          <input
            id="following-search"
            type="search"
            placeholder={`Search ${activeType.toLowerCase()}s`}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </div>

      {actionError && <p className={styles.listError}>{actionError}</p>}

      {loading && items.length === 0 ? (
         <div style={{ marginTop: '1rem' }}>
           <Skeleton variant="card" count={3} />
         </div>
      ) : error ? (
         <p className={styles.listError}>{error}</p>
      ) : visibleItems.length === 0 ? (
        <div className={styles.emptyFollowing}>
          <strong>No followed items found</strong>
          <p>Try another filter or search term.</p>
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <ul className={styles.followingList}>
            {visibleItems.map((item) => {
              const config = FOLLOW_CONFIG[item.type]
              const itemKey = `${item.type}-${item.id}`
              return (
                <li key={itemKey} className={styles.followingItem}>
                  <span className={styles.followBadge}>{item.type}</span>
                  <div className={styles.followMain}>
                    <Link className={styles.followLink} to={config.route(item.id)}>
                      {item.name}
                    </Link>
                    <span className={styles.followMeta}>{formatFollowedAt(item.followedAt)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.unfollowBtn}
                    onClick={() => handleUnfollow(item)}
                    disabled={pendingKey === itemKey}
                  >
                    {pendingKey === itemKey ? 'Removing...' : 'Unfollow'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {totalPages > 1 && !error && (
        <div style={{ marginTop: '2rem', pointerEvents: loading ? 'none' : 'auto' }}>
           <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </section>
  )
}

export default FollowingPage
