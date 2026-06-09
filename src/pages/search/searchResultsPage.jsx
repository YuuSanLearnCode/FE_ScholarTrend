import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchResultsList from '../../components/SearchResultsList'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { searchPapers } from '../../services/paperService'
import styles from './searchResultsPage.module.css'

function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const [papers, setPapers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      setError('')
      try {
        const keyword = searchParams.get('keyword') ?? ''
        const author = searchParams.get('author') ?? ''
        const journal = searchParams.get('journal') ?? ''
        const params = { page, pageSize: 10 }
        if (keyword) params.keyword = keyword
        if (author) params.author = author
        if (journal) params.journal = journal

        const result = await searchPapers(params)
        setPapers(result.items ?? result ?? [])
        setTotalCount(result.totalCount ?? (result.items ? result.items.length : result.length ?? 0))
        setTotalPages(result.totalPages ?? 1)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load search results')
        setPapers([])
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [searchParams, page])

  if (loading) {
    return (
      <section className={styles.resultsPage}>
        <div className={styles.pageHeader}>
          <Skeleton variant="title" width="40%" />
        </div>
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.resultsPage}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.resultsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Search Results</h1>
        <p className={styles.summary}>
          Found <span className={styles.summaryCount}>{totalCount}</span> matching paper(s).
        </p>
      </div>
      <SearchResultsList papers={papers} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  )
}

export default SearchResultsPage
