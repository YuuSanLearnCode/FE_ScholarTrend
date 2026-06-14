import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFollowedTopics, getFollowedJournals, unfollowTopic, unfollowJournal } from '../../services/followService'
import Skeleton from '../../components/Skeleton'
import styles from './simpleListPage.module.css'

function FollowingPage() {
  const [topics, setTopics] = useState([])
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchFollowing() {
      try {
        const [topicsResult, journalsResult] = await Promise.all([
          getFollowedTopics(),
          getFollowedJournals(),
        ])
        setTopics(topicsResult ?? [])
        setJournals(journalsResult ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load following data')
        setTopics([])
        setJournals([])
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

  return (
    <section className={styles.panel}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Following</h1>
      </div>

      {/* Topics Section */}
      <h2 className={styles.pageTitle} style={{ fontSize: '1.1rem', marginTop: '1rem' }}>Topics</h2>
      <ul className={styles.list}>
        {topics.length === 0 && (
          <li className={styles.listItem}>
            <span className={styles.listItemText}>No followed topics yet.</span>
          </li>
        )}
        {topics.map((item) => {
          const id = item.id ?? item
          const name = item.name ?? item.topic ?? String(item)
          return (
            <li key={id} className={styles.listItem}>
              <Link
                className={styles.listItemText}
                to={`/journals/${encodeURIComponent(id)}`}
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
              <span className={styles.listItemText}>{name}</span>
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
