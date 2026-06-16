import { useState } from 'react'
import { Link } from 'react-router-dom'
import { followPaper } from '../services/followService'
import styles from './PaperCard.module.css'

function PaperCard({ paper, canFollow = false, isFollowing = false, onFollowSuccess }) {
  const keywords = paper.keywords ?? []
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')

  const handleFollow = async () => {
    if (!paper?.id || isFollowing || followLoading) return

    setFollowLoading(true)
    setFollowError('')
    try {
      await followPaper(paper.id)
      onFollowSuccess?.(paper.id)
    } catch (err) {
      setFollowError(err.response?.data?.message || err.message || 'Failed to follow paper.')
    } finally {
      setFollowLoading(false)
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Link to={`/papers/${paper.id}`}>{paper.title}</Link>
        </h3>
        <span className={styles.yearBadge}>{paper.year ?? 'N/A'}</span>
      </div>
      <div className={styles.authors}>
        {(paper.authors ?? []).map((author) => (
          <Link key={author} to={`/authors/${encodeURIComponent(author)}`} className={styles.authorPill}>
            {author}
          </Link>
        ))}
      </div>
      <div className={styles.metadata}>
        {paper.journalId ? (
          <Link
            className={styles.journal}
            to={`/journals/${paper.journalId}`}
          >
            {paper.journal}
          </Link>
        ) : (
          <span className={styles.journal}>{paper.journal || 'Unknown journal'}</span>
        )}
        <span>{paper.citationCount ?? 0} citations</span>
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noreferrer"
            className={styles.doiLink}
          >
            DOI
          </a>
        )}
      </div>
      <p className={styles.abstract}>{paper.abstract || 'No abstract available.'}</p>
      {keywords.length > 0 && (
        <div className={styles.keywords}>
          {keywords.slice(0, 5).map((keyword) => (
            <Link
              key={keyword}
              to={`/search/results?keyword=${encodeURIComponent(keyword)}&searchType=Keyword&page=1&pageSize=10`}
              className={styles.keyword}
            >
              {keyword}
            </Link>
          ))}
        </div>
      )}

      <div className={styles.cardActions}>
        <Link to={`/papers/${paper.id}`} className={styles.detailLink}>
          View details
        </Link>
        {canFollow ? (
          <button
            type="button"
            className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
            onClick={handleFollow}
            disabled={followLoading || isFollowing}
          >
            {followLoading ? 'Following...' : isFollowing ? 'Following' : 'Follow paper'}
          </button>
        ) : (
          <Link to="/login" className={styles.followButton}>
            Sign in to follow
          </Link>
        )}
      </div>
      {followError && <p className={styles.followError}>{followError}</p>}
    </article>
  )
}

export default PaperCard
