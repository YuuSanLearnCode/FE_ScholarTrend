import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Skeleton from '../../components/Skeleton'
import { getAuthors } from '../../services/authorService'
import styles from './authorsPage.module.css'

function AuthorsPage() {
  const [authors, setAuthors] = useState([])
  const [query, setQuery] = useState('')
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

  const totalPapers = authors.reduce((sum, author) => sum + (author.paperCount ?? 0), 0)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Research network</span>
          <h1>Authors</h1>
          <p>Browse researchers, affiliations, countries, and their publication volume.</p>
        </div>
        <div className={styles.summary}>
          <strong>{authors.length}</strong>
          <span>authors</span>
          <strong>{totalPapers}</strong>
          <span>papers</span>
        </div>
      </header>

      <div className={styles.searchPanel}>
        <label htmlFor="author-search">Search authors</label>
        <input
          id="author-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, affiliation, or country"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <Skeleton variant="card" count={6} />
      ) : filteredAuthors.length > 0 ? (
        <div className={styles.grid}>
          {filteredAuthors.map((author) => (
            <Link
              key={author.id ?? author.name}
              to={`/authors/id/${encodeURIComponent(author.id)}`}
              className={styles.card}
            >
              <div>
                <span className={styles.authorId}>#{author.id}</span>
                <h2>{author.name}</h2>
                <p>{author.affiliation || 'Affiliation not specified'}</p>
              </div>
              <div className={styles.cardFooter}>
                <span>{author.country || 'Unknown country'}</span>
                <strong>{author.paperCount} papers</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>No authors match your search.</div>
      )}
    </section>
  )
}

export default AuthorsPage
