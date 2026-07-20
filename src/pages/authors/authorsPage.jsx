import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { getAuthors } from '../../services/authorService'
import styles from './authorsPage.module.css'

const PAGE_SIZE = 10

function getInitials(name) {
  return String(name || 'Author')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function AuthorsPage() {
  const [authors, setAuthors] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function fetchAuthors() {
      try {
        const result = await getAuthors()
        if (active) setAuthors(result)
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Failed to load authors.')
          setAuthors([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAuthors()
    return () => {
      active = false
    }
  }, [])

  const filteredAuthors = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return authors

    return authors.filter((author) =>
      [author.name, author.affiliation, author.country]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    )
  }, [authors, query])

  const totalPages = Math.max(1, Math.ceil(filteredAuthors.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageAuthors = useMemo(
    () => filteredAuthors.slice(startIndex, startIndex + PAGE_SIZE),
    [filteredAuthors, startIndex],
  )
  const firstResult = filteredAuthors.length > 0 ? startIndex + 1 : 0
  const lastResult = Math.min(startIndex + pageAuthors.length, filteredAuthors.length)
  const totalPapers = authors.reduce((sum, author) => sum + (author.paperCount ?? 0), 0)

  const handleSearchChange = (event) => {
    setQuery(event.target.value)
    setPage(1)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Research network</span>
          <h1>Authors</h1>
          <p>Find researchers by name, affiliation, or country.</p>
        </div>
        <div className={styles.summary}>
          <span>
            <strong>{authors.length}</strong>
            Authors
          </span>
          <span>
            <strong>{totalPapers}</strong>
            Papers
          </span>
        </div>
      </header>

      <div className={styles.searchPanel}>
        <label htmlFor="author-search">Search authors</label>
        <input
          id="author-search"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search by name, affiliation, or country"
        />
        <span className={styles.resultCount}>
          {filteredAuthors.length > 0
            ? `${firstResult}-${lastResult} of ${filteredAuthors.length}`
            : '0 results'}
        </span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <Skeleton variant="card" count={6} />
      ) : filteredAuthors.length > 0 ? (
        <>
          <div className={styles.grid}>
            {pageAuthors.map((author) => {
              const authorPath = author.id
                ? `/authors/id/${encodeURIComponent(author.id)}`
                : `/authors/${encodeURIComponent(author.name)}`

              return (
                <Link
                  key={author.id ?? author.name}
                  to={authorPath}
                  className={styles.card}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.avatar}>{getInitials(author.name)}</span>
                    <div>
                      <span className={styles.authorId}>
                        {author.id ? `#${author.id}` : 'Profile'}
                      </span>
                      <h2>{author.name}</h2>
                    </div>
                  </div>
                  <p>{author.affiliation || 'Affiliation not specified'}</p>
                  <div className={styles.cardFooter}>
                    <span>{author.country || 'Unknown country'}</span>
                    <strong>{author.paperCount ?? 0} papers</strong>
                  </div>
                </Link>
              )
            })}
          </div>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className={styles.empty}>No authors match your search.</div>
      )}
    </section>
  )
}

export default AuthorsPage
