import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { getJournals } from '../../services/journalService'
import styles from './journalsPage.module.css'

const PAGE_SIZE = 12

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function JournalsPage() {
  const [allJournals, setAllJournals] = useState([])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch all journals once
  useEffect(() => {
    let active = true

    async function fetchJournals() {
      setLoading(true)
      setError('')
      try {
        const result = await getJournals()
        if (!active) return
        setAllJournals(result)
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Failed to load journals.')
          setAllJournals([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchJournals()
    return () => {
      active = false
    }
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSubmittedQuery(query.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  // Filter journals client-side
  const filteredJournals = useMemo(() => {
    if (!submittedQuery) return allJournals
    const lowerQuery = submittedQuery.toLowerCase()
    return allJournals.filter((journal) =>
      journal.name.toLowerCase().includes(lowerQuery)
    )
  }, [allJournals, submittedQuery])

  const totalCount = filteredJournals.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Paginate journals client-side
  const currentJournals = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return filteredJournals.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredJournals, page])

  const totalPapersOnPage = useMemo(
    () => currentJournals.reduce((sum, journal) => sum + (journal.paperCount ?? 0), 0),
    [currentJournals],
  )

  const handleSearchChange = (event) => {
    setQuery(event.target.value)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Academic Journals</span>
          <h1>Journals</h1>
          <p>Explore top scientific journals and access their publications.</p>
        </div>
        <div className={styles.summary}>
          <span>
            <strong>{totalCount}</strong>
            Journals
          </span>
          <span>
            <strong>{formatNumber(totalPapersOnPage)}</strong>
            Papers on this page
          </span>
        </div>
      </header>

      <div className={styles.searchPanel}>
        <label htmlFor="journal-search">Search journals</label>
        <input
          id="journal-search"
          type="text"
          placeholder="e.g. Machine Learning, Nature..."
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
            <Skeleton key={i} height="180px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : currentJournals.length === 0 ? (
        <div className={styles.empty}>
          {submittedQuery
            ? `No journals found matching "${submittedQuery}".`
            : 'No journals available yet.'}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {currentJournals.map((journal) => (
              <Link to={`/journals/${journal.id}`} key={journal.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.icon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                  </div>
                  <div>
                    <h2>{journal.name}</h2>
                    {journal.publisher && <span className={styles.publisher}>{journal.publisher}</span>}
                  </div>
                </div>
                
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span>Impact Factor</span>
                    <strong>{Number(journal.impactFactor).toFixed(2)}</strong>
                  </div>
                  {journal.issn && (
                    <div className={styles.statItem}>
                      <span>ISSN</span>
                      <strong>{journal.issn}</strong>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span>Explore journal &rarr;</span>
                  <strong>{formatNumber(journal.paperCount)} papers</strong>
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

export default JournalsPage
