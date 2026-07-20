import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { aggregatePaperById, getPaperById, recordView } from '../../services/paperService'
import { addBookmark, removeBookmark } from '../../services/bookmarkService'
import {
  followPaper,
  getFollowedPapers,
  unfollowPaper,
} from '../../services/followService'
import Skeleton from '../../components/Skeleton'
import styles from './paperDetailPage.module.css'

function formatDate(value) {
  if (!value) return 'Not specified'

  let dateString = value;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    dateString += 'Z';
  }
  const date = new Date(dateString)
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

function formatScore(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 'N/A'

  return `${Math.round(numericValue)}%`
}

function PaperDetailPage() {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [bookmarkError, setBookmarkError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')
  const [aggregateData, setAggregateData] = useState(null)
  const [aggregateLoading, setAggregateLoading] = useState(false)
  const [aggregateError, setAggregateError] = useState('')

  useEffect(() => {
    async function fetchPaper() {
      setLoading(true)
      setError('')
      setFollowError('')
      setIsFollowing(false)
      setAggregateData(null)
      setAggregateError('')
      try {
        const hasToken = Boolean(localStorage.getItem('token'))
        const result = await getPaperById(paperId)
        setPaper(result)
        setBookmarked(result.isBookmarked)

        if (hasToken) {
          // Record paper view in background
          try {
            await recordView(paperId)
          } catch {
            // Ignore if recording view fails
          }

          try {
            const followedResult = await getFollowedPapers({ page: 1, pageSize: 1000 })
            const followedPapers = followedResult?.items ?? []
            setIsFollowing(
              followedPapers.some((item) => Number(item.id) === Number(result.id)),
            )
          } catch {
            // Ignore follow-status lookup errors so paper details still render.
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load paper details')
      } finally {
        setLoading(false)
      }
    }

    fetchPaper()
  }, [paperId])

  const handleFollowToggle = async () => {
    if (!paper?.id || followLoading) return

    setFollowLoading(true)
    setFollowError('')
    try {
      if (isFollowing) {
        await unfollowPaper(paper.id)
        setIsFollowing(false)
      } else {
        await followPaper(paper.id)
        setIsFollowing(true)
      }
    } catch (err) {
      setFollowError(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${isFollowing ? 'unfollow' : 'follow'} paper.`,
      )
    } finally {
      setFollowLoading(false)
    }
  }

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

  const handleAggregateSubmit = async (event) => {
    event.preventDefault()

    if (!paper?.id) {
      setAggregateError('Paper id is required to aggregate metadata.')
      return
    }

    setAggregateLoading(true)
    setAggregateError('')
    try {
      const result = await aggregatePaperById(paper.id)
      setAggregateData(result)
    } catch (err) {
      setAggregateData(null)
      setAggregateError(
        err.response?.data?.message ||
          err.message ||
          'Failed to aggregate paper metadata.',
      )
    } finally {
      setAggregateLoading(false)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/search')
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
        <button type="button" className={styles.backButton} onClick={handleBack}>
          <span aria-hidden="true">&larr;</span>
          Back
        </button>
      </div>
    )
  }

  const doiUrl = getExternalUrl(paper.doi, 'https://doi.org/')
  const sourceUrl = getExternalUrl(paper.url)
  const pdfUrl = getExternalUrl(paper.pdfUrl)

  return (
    <article className={styles.detailPage}>
      <button type="button" className={styles.backButton} onClick={handleBack}>
        <span aria-hidden="true">&larr;</span>
        Back
      </button>

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
          {localStorage.getItem('token') ? (
            <button
              type="button"
              className={`${styles.followButton} ${isFollowing ? styles.followingButton : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading
                ? isFollowing ? 'Unfollowing...' : 'Following...'
                : isFollowing ? 'Unfollow paper' : 'Follow paper'}
            </button>
          ) : (
            <Link className={styles.followButton} to="/login">
              Sign in to follow
            </Link>
          )}
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
        {followError && <p className={styles.followError}>{followError}</p>}
        {bookmarkError && <p className={styles.bookmarkError}>{bookmarkError}</p>}
      </header>

      <section className={styles.metrics}>
        <div>
          <span>Views</span>
          <strong>{paper.viewCount.toLocaleString()}</strong>
        </div>
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

      <section className={`${styles.panel} ${styles.aggregatePanel}`}>
        <div className={styles.aggregateHeader}>
          <div className={styles.sectionHeading}>
            <span>External metadata</span>
            <h2>Aggregate paper metadata</h2>
          </div>
          <form className={styles.aggregateForm} onSubmit={handleAggregateSubmit}>
            <button
              type="submit"
              className={styles.aggregateButton}
              disabled={aggregateLoading}
            >
              {aggregateLoading ? 'Aggregating...' : `Aggregate paper #${paper.id}`}
            </button>
          </form>
        </div>

        {aggregateError && <p className={styles.aggregateError}>{aggregateError}</p>}

        {aggregateData && (
          <div className={styles.aggregateResult}>
            <div className={styles.aggregateScores}>
              <div>
                <span>Completeness</span>
                <strong>{formatScore(aggregateData.completenessScore)}</strong>
              </div>
              <div>
                <span>Trust score</span>
                <strong>{formatScore(aggregateData.trustScore)}</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{aggregateData.confidenceLevel}</strong>
              </div>
              <div>
                <span>Match method</span>
                <strong>{aggregateData.matchMethod}</strong>
              </div>
            </div>

            <div className={styles.aggregateSummary}>
              <article>
                <h3>Unified metadata</h3>
                <strong>{aggregateData.unifiedMetadata.title || 'Title not available'}</strong>
                <p>{aggregateData.unifiedMetadata.abstract || 'No abstract returned from sources.'}</p>
                <div className={styles.aggregateMetaList}>
                  <span>{aggregateData.unifiedMetadata.journal || 'Unknown journal'}</span>
                  <span>{aggregateData.unifiedMetadata.year || 'Year unavailable'}</span>
                  <span>
                    {(aggregateData.unifiedMetadata.citationCount ?? 0).toLocaleString()} citations
                  </span>
                </div>
              </article>

              <article>
                <h3>Sources matched</h3>
                <div className={styles.aggregateBadges}>
                  {aggregateData.sourcesMatched.length > 0 ? (
                    aggregateData.sourcesMatched.map((source) => (
                      <span key={source}>{source}</span>
                    ))
                  ) : (
                    <em>No source matched</em>
                  )}
                </div>
                <small>
                  Attempted: {aggregateData.sourcesAttempted.join(', ') || 'No source listed'}
                </small>
              </article>
            </div>

            <div className={styles.sourceGrid}>
              {aggregateData.sources.map((source) => (
                <article key={source.key} className={styles.sourceCard}>
                  <div className={styles.sourceCardTop}>
                    <strong>{source.source || source.key}</strong>
                    <span className={source.found ? styles.sourceFound : styles.sourceMissing}>
                      {source.found ? 'Found' : 'Missing'}
                    </span>
                  </div>
                  <p>{source.title || source.errorMessage || 'No metadata returned.'}</p>
                  <small>
                    {[source.year, source.journal].filter(Boolean).join(' • ') || 'No publication info'}
                  </small>
                </article>
              ))}
            </div>

            {(aggregateData.dataGaps.length > 0 || aggregateData.conflicts.length > 0) && (
              <div className={styles.qualityGrid}>
                {aggregateData.dataGaps.length > 0 && (
                  <article>
                    <h3>Data gaps</h3>
                    {aggregateData.dataGaps.map((gap) => (
                      <p key={`${gap.field}-${gap.status}`}>
                        <strong>{gap.field}</strong>: {gap.message || gap.status}
                      </p>
                    ))}
                  </article>
                )}

                {aggregateData.conflicts.length > 0 && (
                  <article>
                    <h3>Conflicts</h3>
                    {aggregateData.conflicts.map((conflict) => (
                      <p key={`${conflict.field}-${conflict.status}`}>
                        <strong>{conflict.field}</strong>: {conflict.note || conflict.status}
                      </p>
                    ))}
                  </article>
                )}
              </div>
            )}

            {aggregateData.recommendations.length > 0 && (
              <div className={styles.recommendations}>
                <h3>Recommendations</h3>
                <ul>
                  {aggregateData.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
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
                    key={topic.id || topic.name}
                    to={topic.id ? `/topics/${topic.id}` : `/search/results?keyword=${encodeURIComponent(topic.name)}&page=1&pageSize=10`}
                    className={styles.topicTag}
                  >
                    {topic.name}
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
