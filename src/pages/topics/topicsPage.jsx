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
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function fetchTopics() {
      try {
        const result = await getTopics()
        if (active) setTopics(result)
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Failed to load topics.')
          setTopics([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchTopics()
    return () => {
      active = false
    }
  }, [])

  const filteredTopics = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return topics

    return topics.filter((topic) =>
      [topic.name, topic.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    )
  }, [topics, query])

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageTopics = useMemo(
    () => filteredTopics.slice(startIndex, startIndex + PAGE_SIZE),
    [filteredTopics, startIndex],
  )
  const totalPapers = topics.reduce((sum, topic) => sum + (topic.paperCount ?? 0), 0)

  const handleSearchChange = (event) => {
    setQuery(event.target.value)
    setPage(1)
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
            <strong>{topics.length}</strong>
            Topics
          </span>
          <span>
            <strong>{totalPapers}</strong>
            Papers
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
          {filteredTopics.length} result{filteredTopics.length !== 1 ? 's' : ''}
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
      ) : filteredTopics.length === 0 ? (
        <div className={styles.empty}>No topics found matching "{query}".</div>
      ) : (
        <>
          <div className={styles.grid}>
            {pageTopics.map((topic) => (
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
              page={currentPage}
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
