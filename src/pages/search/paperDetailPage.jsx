import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPaperById } from '../../services/paperService'
import { addBookmark, removeBookmark } from '../../services/bookmarkService'
import Skeleton from '../../components/Skeleton'
import styles from './paperDetailPage.module.css'

function formatDate(value) {
  if (!value) return 'Not specified'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not specified'

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getExternalUrl(value, prefix = '') {
  if (!value) return ''
  const normalizedValue = value.trim()
  if (/^https?:\/\//i.test(normalizedValue)) return normalizedValue
  return prefix ? `${prefix}${normalizedValue}` : ''
}

function PaperDetailPage() {
  const { paperId } = useParams()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [bookmarkError, setBookmarkError] = useState('')

  useEffect(() => {
    async function fetchPaper() {
      setLoading(true)
      setError('')
      try {
        const result = await getPaperById(paperId)
        setPaper(result)
        setBookmarked(result.isBookmarked)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load paper details')
      } finally {
        setLoading(false)
      }
    }

    fetchPaper()
  }, [paperId])

  const handleBookmarkToggle = async () => {
    setBookmarkLoading(true)
    setBookmarkError('')
    try {
      if (bookmarked) {
        await removeBookmark(paperId)
        setBookmarked(false)
      } else {
        await addBookmark(paperId)
        setBookmarked(true)
      }
    } catch (err) {
      setBookmarkError(err.response?.data?.message || err.message || 'Failed to update bookmark.')
    } finally {
      setBookmarkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <Skeleton variant="title" width="75%" />
        <div className={styles.loadingCard}>
          <Skeleton variant="card" height="360px" />
        </div>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div className={styles.notFound}>
        <strong>{error || 'Paper not found.'}</strong>
        <Link to="/search">Return to search</Link>
      </div>
    )
  }

  const doiUrl = getExternalUrl(paper.doi, 'https://doi.org/')
  const sourceUrl = getExternalUrl(paper.url)
  const pdfUrl = getExternalUrl(paper.pdfUrl)

  return (
    <article className={styles.detailPage}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/search">Search</Link>
        <span>/</span>
        <span>Paper details</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.journalLine}>
            {paper.journal?.id ? (
              <Link
                to={`/journals/${paper.journal.id}`}
              >
                {paper.journalName}
              </Link>
            ) : (
              <span>{paper.journalName}</span>
            )}
            {paper.journal?.issn && <span>ISSN {paper.journal.issn}</span>}
          </div>
          <span className={styles.yearBadge}>{paper.year ?? 'Year unavailable'}</span>
        </div>

        <h1 className={styles.title}>{paper.title}</h1>

        <div className={styles.authors}>
          {paper.authors.length > 0 ? (
            paper.authors.map((author) => (
              <div key={author.id ?? author.name} className={styles.author}>
                <Link to={`/authors/${encodeURIComponent(author.name)}`}>
                  {author.name}
                </Link>
                {author.affiliation && <span>{author.affiliation}</span>}
              </div>
            ))
          ) : (
            <span className={styles.mutedText}>Authors not specified</span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.bookmarkButton} ${bookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmarkToggle}
            disabled={bookmarkLoading}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 3a2 2 0 0 0-2 2v17l8-4 8 4V5a2 2 0 0 0-2-2H6Zm0 2h12v13.76l-6-3-6 3V5Z" />
            </svg>
            {bookmarkLoading ? 'Saving...' : bookmarked ? 'Bookmarked' : 'Bookmark paper'}
          </button>
          {sourceUrl && (
            <a className={styles.secondaryButton} href={sourceUrl} target="_blank" rel="noreferrer">
              View source
            </a>
          )}
          {pdfUrl && (
            <a className={styles.pdfButton} href={pdfUrl} target="_blank" rel="noreferrer">
              Open PDF
            </a>
          )}
        </div>
        {bookmarkError && <p className={styles.bookmarkError}>{bookmarkError}</p>}
      </header>

      <section className={styles.metrics}>
        <div>
          <span>Citations</span>
          <strong>{paper.citationCount.toLocaleString()}</strong>
        </div>
        <div>
          <span>Publication date</span>
          <strong>{formatDate(paper.publicationDate)}</strong>
        </div>
        <div>
          <span>DOI</span>
          {doiUrl ? (
            <a href={doiUrl} target="_blank" rel="noreferrer">{paper.doi}</a>
          ) : (
            <strong>Not available</strong>
          )}
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <span>Overview</span>
            <h2>Abstract</h2>
          </div>
          <p className={styles.abstractText}>
            {paper.abstract || 'No abstract is available for this paper.'}
          </p>
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <span>Classification</span>
              <h2>Research areas</h2>
            </div>

            <h3 className={styles.tagLabel}>Topics</h3>
            <div className={styles.tags}>
              {paper.topics.length > 0 ? (
                paper.topics.map((topic) => (
                  <Link
                    key={topic}
                    to={`/search/results?keyword=${encodeURIComponent(topic)}&page=1&pageSize=10`}
                    className={styles.topicTag}
                  >
                    {topic}
                  </Link>
                ))
              ) : (
                <span className={styles.mutedText}>No topics</span>
              )}
            </div>

            <h3 className={styles.tagLabel}>Keywords</h3>
            <div className={styles.tags}>
              {paper.keywords.length > 0 ? (
                paper.keywords.map((keyword) => (
                  <Link
                    key={keyword}
                    to={`/search/results?keyword=${encodeURIComponent(keyword)}&searchType=Keyword&page=1&pageSize=10`}
                    className={styles.keywordTag}
                  >
                    {keyword}
                  </Link>
                ))
              ) : (
                <span className={styles.mutedText}>No keywords</span>
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <span>Publication</span>
              <h2>Journal information</h2>
            </div>
            <dl className={styles.journalDetails}>
              <div>
                <dt>Journal</dt>
                <dd>{paper.journalName}</dd>
              </div>
              <div>
                <dt>ISSN</dt>
                <dd>{paper.journal?.issn || 'Not available'}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </article>
  )
}

export default PaperDetailPage
