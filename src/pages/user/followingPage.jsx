import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFollowedAuthors,
  getFollowedJournals,
  getFollowedPapers,
  getFollowedTopics,
  unfollowAuthor,
  unfollowJournal,
  unfollowPaper,
  unfollowTopic,
} from '../../services/followService'
import Skeleton from '../../components/Skeleton'
import styles from './simpleListPage.module.css'

const FOLLOW_TYPES = [
  { key: 'All', label: 'All', singular: 'Item' },
  { key: 'Topic', label: 'Topics', singular: 'Topic' },
  { key: 'Author', label: 'Authors', singular: 'Author' },
  { key: 'Paper', label: 'Papers', singular: 'Paper' },
  { key: 'Journal', label: 'Journals', singular: 'Journal' },
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

function normalizeFollowItem(item, type) {
  const id = item.targetId ?? item.id ?? item
  const fallbackName = `${type} ${id}`

  return {
    ...item,
    id,
    type,
    name: item.name ?? item[type.toLowerCase()] ?? fallbackName,
    followedAt: item.followedAt ?? null,
  }
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

function sortByFollowedAt(items) {
  return [...items].sort((a, b) => {
    const firstTime = a.followedAt ? new Date(a.followedAt).getTime() : 0
    const secondTime = b.followedAt ? new Date(b.followedAt).getTime() : 0

    return secondTime - firstTime
  })
}

function FollowingPage() {
  const [items, setItems] = useState([])
  const [activeType, setActiveType] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingKey, setPendingKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    async function fetchFollowing() {
      try {
        const [topicsResult, journalsResult, authorsResult, papersResult] = await Promise.all([
          getFollowedTopics(),
          getFollowedJournals(),
          getFollowedAuthors(),
          getFollowedPapers(),
        ])

        const mergedItems = [
          ...(topicsResult ?? []).map((item) => normalizeFollowItem(item, 'Topic')),
          ...(authorsResult ?? []).map((item) => normalizeFollowItem(item, 'Author')),
          ...(papersResult ?? []).map((item) => normalizeFollowItem(item, 'Paper')),
          ...(journalsResult ?? []).map((item) => normalizeFollowItem(item, 'Journal')),
        ]

        setItems(sortByFollowedAt(mergedItems))
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load following data')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchFollowing()
  }, [])

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

  if (loading) {
    return (
      <section className={styles.panel}>
        <Skeleton variant="title" width="30%" />
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.panel}>
        <p className={styles.listError}>{error}</p>
      </section>
    )
  }

  const counts = FOLLOW_TYPES.reduce((result, type) => {
    result[type.key] = type.key === 'All'
      ? items.length
      : items.filter((item) => item.type === type.key).length
    return result
  }, {})
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const visibleItems = items.filter((item) => {
    const matchesType = activeType === 'All' || item.type === activeType
    const matchesSearch = !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.type.toLowerCase().includes(normalizedSearch)

    return matchesType && matchesSearch
  })
  const summaryItems = FOLLOW_TYPES.map((type) => ({
    label: type.key === 'All' ? 'Total following' : type.label,
    value: counts[type.key],
  }))

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
              onClick={() => setActiveType(type.key)}
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
            placeholder="Search followed items"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </div>

      {actionError && <p className={styles.listError}>{actionError}</p>}

      {visibleItems.length === 0 ? (
        <div className={styles.emptyFollowing}>
          <strong>No followed items found</strong>
          <p>Try another filter or search term.</p>
        </div>
      ) : (
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
      )}
    </section>
  )
}

export default FollowingPage
