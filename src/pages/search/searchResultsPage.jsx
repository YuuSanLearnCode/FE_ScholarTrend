import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchResultsList from '../../components/SearchResultsList'
import { searchPapers } from '../../services/paperService'
import styles from './searchResultsPage.module.css'

function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const [papers, setPapers] = useState([])
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
        const params = {}
        if (keyword) params.keyword = keyword
        if (author) params.author = author
        if (journal) params.journal = journal

        const result = await searchPapers(params)
        setPapers(result.items ?? result ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load search results')
        setPapers([])
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [searchParams])

  if (loading) {
    return (
      <section className={styles.resultsPage}>
        <p>Loading...</p>
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
          Found <span className={styles.summaryCount}>{papers.length}</span> matching paper(s).
        </p>
      </div>
      <SearchResultsList papers={papers} />
    </section>
  )
}

export default SearchResultsPage
