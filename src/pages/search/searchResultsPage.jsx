import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SearchResultsList from '../../components/SearchResultsList'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import {
  getPapersByJournal,
  getPapersByTopic,
  searchPapers,
} from '../../services/paperService'
import styles from './searchResultsPage.module.css'

function getPositiveNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchKey = searchParams.toString()
  const [result, setResult] = useState({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const query = searchParams.get('query') ?? searchParams.get('keyword') ?? ''
  const topicId = searchParams.get('topicId')
  const topicName = searchParams.get('topicName') ?? ''
  const journalId = searchParams.get('journalId')
  const journalName = searchParams.get('journalName') ?? ''
  const searchType = searchParams.get('searchType') ?? 'All'
  const currentPage = getPositiveNumber(searchParams.get('page'), 1)
  const pageSize = getPositiveNumber(searchParams.get('pageSize'), 10)

  useEffect(() => {
    async function fetchResults() {
      const params = new URLSearchParams(searchKey)

      setLoading(true)
      setError('')
      try {
        const requestParams = {
          page: getPositiveNumber(params.get('page'), 1),
          pageSize: getPositiveNumber(params.get('pageSize'), 10),
        }
        const selectedTopicId = params.get('topicId')
        const selectedJournalId = params.get('journalId')
        let response

        if (selectedTopicId) {
          response = await getPapersByTopic(selectedTopicId, requestParams)
        } else if (selectedJournalId) {
          response = await getPapersByJournal(selectedJournalId, requestParams)
        } else {
          response = await searchPapers({
            ...requestParams,
            query: params.get('query') ?? params.get('keyword') ?? '',
            searchType: params.get('searchType') ?? 'All',
            yearFrom: params.get('yearFrom') || undefined,
            yearTo: params.get('yearTo') || undefined,
            minCitations: params.get('minCitations') || undefined,
          })
        }
        setResult({
          items: response.items ?? [],
          totalCount: response.totalCount ?? 0,
          page: response.page ?? 1,
          pageSize: response.pageSize ?? 10,
          totalPages: response.totalPages ?? 0,
        })
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load search results')
        setResult({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [searchKey])

  const handlePageChange = (nextPage) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(nextPage))
    if (!nextParams.has('pageSize')) nextParams.set('pageSize', String(pageSize))
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFilters = [
    topicId ? `Topic: ${topicName || `#${topicId}`}` : null,
    journalId ? `Journal: ${journalName || `#${journalId}`}` : null,
    searchType !== 'All' ? searchType : null,
    searchParams.get('yearFrom') ? `From ${searchParams.get('yearFrom')}` : null,
    searchParams.get('yearTo') ? `To ${searchParams.get('yearTo')}` : null,
    searchParams.get('minCitations')
      ? `${searchParams.get('minCitations')}+ citations`
      : null,
  ].filter(Boolean)

  return (
    <section className={styles.resultsPage}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Research library</span>
          <h1 className={styles.pageTitle}>
            {topicId
              ? `Papers in "${topicName || `Topic ${topicId}`}"`
              : journalId
                ? `Papers from "${journalName || `Journal ${journalId}`}"`
                : query
                  ? `Results for "${query}"`
                  : 'All publications'}
          </h1>
          {!error && (
            <p className={styles.summary}>
              Found <span className={styles.summaryCount}>{result.totalCount}</span> matching
              paper(s)
              {result.totalPages > 0 && ` · Page ${result.page} of ${result.totalPages}`}
            </p>
          )}
        </div>
        <Link to="/search" className={styles.newSearchButton}>New search</Link>
      </div>

      {activeFilters.length > 0 && (
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Active filters</span>
          {activeFilters.map((filter) => (
            <span key={filter} className={styles.filterChip}>{filter}</span>
          ))}
        </div>
      )}

      {loading && result.items.length === 0 ? (
        <Skeleton variant="card" count={3} />
      ) : error ? (
        <div className={styles.errorState}>
          <strong>Search could not be completed</strong>
          <p>{error}</p>
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
          <SearchResultsList papers={result.items} />
          <Pagination
            page={result.page || currentPage}
            totalPages={result.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  )
}

export default SearchResultsPage
