import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { getTopics } from '../../services/topicService'
import styles from './topicsPage.module.css'

const PAGE_SIZE = 12

function TopicsPage() {
  const [topics, setTopics] = useState([])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSubmittedQuery(query.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let active = true

    async function fetchTopics() {
      setLoading(true)
      setError('')
      try {
        const result = await getTopics({
          keyword: submittedQuery,
          page,
          pageSize: PAGE_SIZE,
        })
        if (!active) return
        setTopics(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(Math.max(1, result.totalPages || 1))
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Failed to load topics.')
          setTopics([])
          setTotalCount(0)
          setTotalPages(1)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchTopics()
    return () => {
      active = false
    }
  }, [page, submittedQuery])

  const totalPapers = useMemo(
    () => topics.reduce((sum, topic) => sum + (topic.paperCount ?? 0), 0),
    [topics],
  )

  const handleSearchChange = (event) => {
    setQuery(event.target.value)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Research Domains</span>
          <h1>Topics</h1>
          <p>Explore and discover popular research topics across the platform.</p>
        </div>
        <div className={styles.summary}>
          <span>
            <strong>{totalCount}</strong>
            Topics
          </span>
          <span>
            <strong>{totalPapers}</strong>
            Papers on this page
          </span>
        </div>
      </header>

      <div className={styles.searchPanel}>
        <label htmlFor="topic-search">Search topics</label>
        <input
          id="topic-search"
          type="text"
          placeholder="e.g. Machine Learning, Deep Learning..."
          value={query}
          onChange={handleSearchChange}
        />
        <div className={styles.resultCount}>
          {totalCount} result{totalCount !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="178px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : topics.length === 0 ? (
        <div className={styles.empty}>
          {submittedQuery
            ? `No topics found matching "${submittedQuery}".`
            : 'No topics available yet.'}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {topics.map((topic) => (
              <Link to={`/topics/${topic.id}`} key={topic.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.icon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                  </div>
                  <div>
                    <h2>{topic.name}</h2>
                  </div>
                </div>
                {topic.description && <p>{topic.description}</p>}
                {!topic.description && <p>No description available for this topic.</p>}
                <div className={styles.cardFooter}>
                  <span>Explore related papers</span>
                  <strong>{topic.paperCount} papers</strong>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </section>
  )
}

export default TopicsPage
