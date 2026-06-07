import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPaperById } from '../../services/paperService'
import { addBookmark, removeBookmark } from '../../services/bookmarkService'
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
        const result = await getPaperById(paperId)
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
    return <p className={styles.notFound}>Loading...</p>
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
            <div className={styles.metaValue}>{(paper.authors ?? []).join(', ')}</div>
          </div>
          <div className={styles.metaCard}>
            <div className={styles.metaLabel}>Year</div>
            <div className={styles.metaValue}>{paper.year}</div>
          </div>
          <div className={styles.metaCard}>
            <div className={styles.metaLabel}>Journal</div>
            <div className={styles.metaValue}>{paper.journal}</div>
          </div>
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
