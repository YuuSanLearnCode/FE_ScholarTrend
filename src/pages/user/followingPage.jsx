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

function FollowingPage() {
  const [topics, setTopics] = useState([])
  const [journals, setJournals] = useState([])
  const [authors, setAuthors] = useState([])
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchFollowing() {
      try {
        const [topicsResult, journalsResult, authorsResult, papersResult] = await Promise.all([
          getFollowedTopics(),
          getFollowedJournals(),
          getFollowedAuthors(),
          getFollowedPapers(),
        ])
        setTopics(topicsResult ?? [])
        setJournals(journalsResult ?? [])
        setAuthors(authorsResult ?? [])
        setPapers(papersResult ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load following data')
        setTopics([])
        setJournals([])
        setAuthors([])
        setPapers([])
      } finally {
        setLoading(false)
      }
    }
    fetchFollowing()
  }, [])

  const handleUnfollowTopic = async (topicId) => {
    try {
      await unfollowTopic(topicId)
      setTopics((prev) => prev.filter((t) => (t.id ?? t) !== topicId))
    } catch {
      // silently fail
    }
  }

  const handleUnfollowJournal = async (journalId) => {
    try {
      await unfollowJournal(journalId)
      setJournals((prev) => prev.filter((j) => (j.id ?? j) !== journalId))
    } catch {
      // silently fail
    }
  }

  const handleUnfollowAuthor = async (authorId) => {
    try {
      await unfollowAuthor(authorId)
      setAuthors((prev) => prev.filter((a) => (a.id ?? a) !== authorId))
    } catch {
      // silently fail
    }
  }

  const handleUnfollowPaper = async (paperId) => {
    try {
      await unfollowPaper(paperId)
      setPapers((prev) => prev.filter((p) => (p.id ?? p) !== paperId))
    } catch {
      // silently fail
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
        <p>{error}</p>
      </section>
    )
  }

  const totalFollowing = topics.length + authors.length + papers.length + journals.length
  const summaryItems = [
    { label: 'Total following', value: totalFollowing },
    { label: 'Topics', value: topics.length },
    { label: 'Authors', value: authors.length },
    { label: 'Papers', value: papers.length },
    { label: 'Journals', value: journals.length },
  ]

  return (
    <section className={styles.panel}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Following</h1>
          <p className={styles.pageSubtitle}>See everything this user is following in one place.</p>
        </div>
      </div>

      <section className={styles.summaryGrid} aria-label="Following summary">
        {summaryItems.map((item) => (
          <article key={item.label} className={styles.summaryCard}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      {/* Topics Section */}
      <h2 className={styles.pageTitle} style={{ fontSize: '1.1rem', marginTop: '1rem' }}>Topics</h2>
      <ul className={styles.list}>
        {topics.length === 0 && (
          <li className={styles.listItem}>
            <span className={styles.listItemText}>No followed topics yet.</span>
          </li>
        )}
        {topics.map((item) => {
          const id = item.targetId ?? item.id ?? item
          const name = item.name ?? item.topic ?? String(item)
          return (
            <li key={id} className={styles.listItem}>
              <Link
                className={styles.listItemText}
                to={`/topics/${encodeURIComponent(id)}`}
              >
                {name}
              </Link>
              <button type="button" className={styles.unfollowBtn} onClick={() => handleUnfollowTopic(id)}>
                Unfollow
              </button>
            </li>
          )
        })}
      </ul>

      {/* Authors Section */}
      <h2 className={styles.pageTitle} style={{ fontSize: '1.1rem', marginTop: '1.5rem' }}>Authors</h2>
      <ul className={styles.list}>
        {authors.length === 0 && (
          <li className={styles.listItem}>
            <span className={styles.listItemText}>No followed authors yet.</span>
          </li>
        )}
        {authors.map((item) => {
          const id = item.targetId ?? item.id ?? item
          const name = item.name ?? item.author ?? String(item)
          return (
            <li key={id} className={styles.listItem}>
              <Link
                className={styles.listItemText}
                to={`/authors/id/${encodeURIComponent(id)}`}
              >
                {name}
              </Link>
              <button type="button" className={styles.unfollowBtn} onClick={() => handleUnfollowAuthor(id)}>
                Unfollow
              </button>
            </li>
          )
        })}
      </ul>

      {/* Papers Section */}
      <h2 className={styles.pageTitle} style={{ fontSize: '1.1rem', marginTop: '1.5rem' }}>Papers</h2>
      <ul className={styles.list}>
        {papers.length === 0 && (
          <li className={styles.listItem}>
            <span className={styles.listItemText}>No followed papers yet.</span>
          </li>
        )}
        {papers.map((item) => {
          const id = item.targetId ?? item.id ?? item
          const name = item.name ?? item.paper ?? String(item)
          return (
            <li key={id} className={styles.listItem}>
              <Link
                className={styles.listItemText}
                to={`/papers/${encodeURIComponent(id)}`}
              >
                {name}
              </Link>
              <button type="button" className={styles.unfollowBtn} onClick={() => handleUnfollowPaper(id)}>
                Unfollow
              </button>
            </li>
          )
        })}
      </ul>

      {/* Journals Section */}
      <h2 className={styles.pageTitle} style={{ fontSize: '1.1rem', marginTop: '1.5rem' }}>Journals</h2>
      <ul className={styles.list}>
        {journals.length === 0 && (
          <li className={styles.listItem}>
            <span className={styles.listItemText}>No followed journals yet.</span>
          </li>
        )}
        {journals.map((item) => {
          const id = item.targetId ?? item.id ?? item
          const name = item.name ?? item.journal ?? String(item)
          return (
            <li key={id} className={styles.listItem}>
              <Link
                className={styles.listItemText}
                to={`/journals/${encodeURIComponent(id)}`}
              >
                {name}
              </Link>
              <button type="button" className={styles.unfollowBtn} onClick={() => handleUnfollowJournal(id)}>
                Unfollow
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default FollowingPage
