import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SearchResultsList from '../../components/SearchResultsList'
import Skeleton from '../../components/Skeleton'
import { getAuthorById, getAuthorByName } from '../../services/authorService'
import styles from './authorDetailPage.module.css'

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function AuthorDetailPage() {
  const { authorId, authorName } = useParams()
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function fetchAuthor() {
      try {
        const result = authorId
          ? await getAuthorById(authorId)
          : await getAuthorByName(authorName)
        if (active) setAuthor(result)
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Failed to load author details.')
          setAuthor(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAuthor()
    return () => {
      active = false
    }
  }, [authorId, authorName])

  if (loading) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="40%" />
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error || !author) {
    return (
      <section className={styles.page}>
        <div className={styles.errorState}>
          <strong>Author could not be loaded</strong>
          <p>{error}</p>
          <Link to="/authors">Back to authors</Link>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Research author</span>
          <h1>{author.name}</h1>
          <p>{author.affiliation || 'Affiliation not specified'}</p>
          <div className={styles.metaLine}>
            {author.country && <span>{author.country}</span>}
            {author.externalId && <span>External ID {author.externalId}</span>}
          </div>
        </div>
        <Link
          className={styles.primaryLink}
          to={`/search/results?query=${encodeURIComponent(author.name)}&searchType=Author&page=1&pageSize=10`}
        >
          View all papers
        </Link>
      </header>

      <div className={styles.statsGrid}>
        <article>
          <span>Papers</span>
          <strong>{formatNumber(author.paperCount)}</strong>
        </article>
        <article>
          <span>Total citations</span>
          <strong>{formatNumber(author.totalCitations)}</strong>
        </article>
        <article>
          <span>H-index</span>
          <strong>{formatNumber(author.hIndex)}</strong>
        </article>
        <article>
          <span>Recent papers</span>
          <strong>{formatNumber(author.recentPapers.length)}</strong>
        </article>
      </div>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Latest research</span>
            <h2>Recent papers</h2>
          </div>
          <span>{author.recentPapers.length} shown</span>
        </div>
        <SearchResultsList papers={author.recentPapers} />
      </section>
    </section>
  )
}

export default AuthorDetailPage
