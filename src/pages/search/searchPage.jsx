import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSearchHistory } from '../../services/paperService'
import styles from './searchPage.module.css'

function formatSearchDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function SearchPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    query: '',
    searchType: 'All',
    yearFrom: '',
    yearTo: '',
    minCitations: '',
    pageSize: '10',
  })
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) return

    async function fetchSearchHistory() {
      setHistoryLoading(true)
      setHistoryError('')
      try {
        const result = await getSearchHistory(20)
        setHistory(result)
      } catch (err) {
        setHistoryError(
          err.response?.data?.message || err.message || 'Failed to load search history.',
        )
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchSearchHistory()
  }, [])

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const yearFrom = form.yearFrom ? Number(form.yearFrom) : null
    const yearTo = form.yearTo ? Number(form.yearTo) : null

    if (yearFrom && yearTo && yearFrom > yearTo) {
      setError('The start year cannot be later than the end year.')
      return
    }

    const params = new URLSearchParams()
    if (form.query.trim()) params.set('query', form.query.trim())
    if (form.searchType !== 'All') params.set('searchType', form.searchType)
    if (form.yearFrom) params.set('yearFrom', form.yearFrom)
    if (form.yearTo) params.set('yearTo', form.yearTo)
    if (form.minCitations) params.set('minCitations', form.minCitations)
    params.set('page', '1')
    params.set('pageSize', form.pageSize)

    navigate(`/search/results?${params.toString()}`)
  }

  const handleHistoryClick = (item) => {
    const params = new URLSearchParams({
      query: item.query || '',
      page: '1',
      pageSize: form.pageSize,
    })
    if (item.searchType && item.searchType !== 'All') {
      params.set('searchType', item.searchType)
    }

    navigate(`/search/results?${params.toString()}`)
  }

  return (
    <section className={styles.searchPage}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Academic discovery</span>
        <h1 className={styles.heroTitle}>Find research that moves your work forward</h1>
        <p className={styles.heroSubtitle}>
          Search publications by title, abstract, author, keyword, year, and citation impact.
        </p>
      </div>

      <div className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.mainSearch}>
            <label htmlFor="query" className={styles.label}>Search publications</label>
            <div className={styles.searchRow}>
              <input
                id="query"
                className={styles.searchInput}
                placeholder="Try machine learning, cloud computing, or an author name"
                value={form.query}
                onChange={handleChange('query')}
                autoFocus
              />
              <select
                id="searchType"
                className={styles.typeSelect}
                aria-label="Search field"
                value={form.searchType}
                onChange={handleChange('searchType')}
              >
                <option value="All">All fields</option>
                <option value="Title">Title</option>
                <option value="Abstract">Abstract</option>
                <option value="Author">Author</option>
                <option value="Keyword">Keyword</option>
                <option value="Journal">Journal</option>
              </select>
            </div>
          </div>

          <div className={styles.filterHeader}>
            <span>Refine results</span>
            <small>All filters are optional</small>
          </div>

          <div className={styles.filterGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="yearFrom" className={styles.label}>From year</label>
              <input
                id="yearFrom"
                className={styles.input}
                type="number"
                min="1900"
                max="2100"
                placeholder="e.g. 2020"
                value={form.yearFrom}
                onChange={handleChange('yearFrom')}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="yearTo" className={styles.label}>To year</label>
              <input
                id="yearTo"
                className={styles.input}
                type="number"
                min="1900"
                max="2100"
                placeholder="e.g. 2026"
                value={form.yearTo}
                onChange={handleChange('yearTo')}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="minCitations" className={styles.label}>Minimum citations</label>
              <input
                id="minCitations"
                className={styles.input}
                type="number"
                min="0"
                placeholder="e.g. 10"
                value={form.minCitations}
                onChange={handleChange('minCitations')}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="pageSize" className={styles.label}>Results per page</label>
              <select
                id="pageSize"
                className={styles.input}
                value={form.pageSize}
                onChange={handleChange('pageSize')}
              >
                <option value="10">10 results</option>
                <option value="20">20 results</option>
                <option value="50">50 results</option>
              </select>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.formFooter}>
            <p>Leave the search box empty to browse all publications.</p>
            <button type="submit" className={styles.button}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 19.6-4.8-4.8a7.5 7.5 0 1 0-1.4 1.4l4.8 4.8L21 19.6ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z" />
              </svg>
              Search publications
            </button>
          </div>
        </form>
      </div>

      {localStorage.getItem('token') && (
        <section className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <div>
              <span className={styles.historyEyebrow}>Your activity</span>
              <h2>Recent searches</h2>
            </div>
            {!historyLoading && history.length > 0 && (
              <span className={styles.historyCount}>{history.length} searches</span>
            )}
          </div>

          {historyLoading ? (
            <div className={styles.historyLoading}>
              <span />
              <span />
              <span />
            </div>
          ) : historyError ? (
            <p className={styles.historyError}>{historyError}</p>
          ) : history.length > 0 ? (
            <div className={styles.historyList}>
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.historyItem}
                  onClick={() => handleHistoryClick(item)}
                >
                  <span className={styles.historyIcon}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M13 3a9 9 0 1 0 8.49 6h-2.1A7 7 0 1 1 17.9 5.1L15 8h7V1l-2.68 2.68A8.96 8.96 0 0 0 13 3Zm-1 4v6h5v-2h-3V7h-2Z" />
                    </svg>
                  </span>
                  <span className={styles.historyDetails}>
                    <strong>{item.query || 'All publications'}</strong>
                    <small>
                      {item.searchType || 'All fields'} · {item.resultCount ?? 0} results
                    </small>
                  </span>
                  <time>{formatSearchDate(item.searchedAt)}</time>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.historyEmpty}>
              Your searches will appear here after you explore the research library.
            </div>
          )}
        </section>
      )}
    </section>
  )
}

export default SearchPage
