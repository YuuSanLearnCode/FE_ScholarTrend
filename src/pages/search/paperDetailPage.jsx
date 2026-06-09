import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPaperById, recordView } from '../../services/paperService'
import { addBookmark, removeBookmark } from '../../services/bookmarkService'
import Skeleton from '../../components/Skeleton'
import styles from './paperDetailPage.module.css'

function PaperDetailPage() {
  const { paperId } = useParams()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  useEffect(() => {
    async function fetchPaper() {
      try {
        const [result] = await Promise.all([
          getPaperById(paperId),
          recordView(paperId).catch(() => {}),
        ])
        setPaper(result)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load paper details')
      } finally {
        setLoading(false)
      }
    }
    fetchPaper()
  }, [paperId])

  const handleBookmarkToggle = async () => {
    setBookmarkLoading(true)
    try {
      if (bookmarked) {
        await removeBookmark(paperId)
        setBookmarked(false)
      } else {
        await addBookmark(paperId)
        setBookmarked(true)
      }
    } catch (err) {
      // silently fail bookmark toggle
    } finally {
      setBookmarkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <Skeleton variant="title" />
        <Skeleton variant="card" />
      </div>
    )
  }

  if (error) {
    return <p className={styles.notFound}>{error}</p>
  }

  if (!paper) {
    return <p className={styles.notFound}>Paper not found.</p>
  }

  return (
    <div className={styles.detailPage}>
      <article className={styles.panel}>
        <h1 className={styles.title}>{paper.title}</h1>

        <div className={styles.metaGrid}>
          <div className={styles.metaCard}>
            <div className={styles.metaLabel}>Authors</div>
            <div className={styles.metaValue}>
              {(paper.authors ?? []).map((author, i) => (
                <span key={author}>
                  {i > 0 && ', '}
                  <Link to={`/authors/${encodeURIComponent(author)}`} className={styles.authorLink}>{author}</Link>
                </span>
              ))}
            </div>
          </div>
          <div className={styles.metaCard}>
            <div className={styles.metaLabel}>Year</div>
            <div className={styles.metaValue}>{paper.year}</div>
          </div>
          <div className={styles.metaCard}>
            <div className={styles.metaLabel}>Journal</div>
            <div className={styles.metaValue}>{paper.journal}</div>
          </div>
          {paper.viewCount !== undefined && (
            <div className={styles.metaCard}>
              <div className={styles.metaLabel}>Views</div>
              <div className={styles.metaValue}>{paper.viewCount.toLocaleString()}</div>
            </div>
          )}
        </div>

        <div className={styles.abstractSection}>
          <div className={styles.abstractLabel}>Abstract</div>
          <p className={styles.abstractText}>{paper.abstract}</p>
        </div>

        <button
          type="button"
          className={`${styles.button} ${bookmarked ? styles.bookmarked : ''}`}
          onClick={handleBookmarkToggle}
          disabled={bookmarkLoading}
        >
          {bookmarkLoading ? 'Saving...' : bookmarked ? 'Bookmarked' : 'Bookmark Paper'}
        </button>
      </article>
    </div>
  )
}

export default PaperDetailPage
