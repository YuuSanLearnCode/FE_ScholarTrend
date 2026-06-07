import { useEffect, useState } from 'react'
import SearchResultsList from '../../components/SearchResultsList'
import { getBookmarks } from '../../services/bookmarkService'
import styles from './simpleListPage.module.css'

function BookmarksPage() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const result = await getBookmarks()
        setPapers(result ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bookmarks')
        setPapers([])
      } finally {
        setLoading(false)
      }
    }
    fetchBookmarks()
  }, [])

  if (loading) {
    return (
      <section className={styles.panel}>
        <p>Loading...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.panel}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.panel}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Bookmarks</h1>
      </div>
      <SearchResultsList papers={papers} />
    </section>
  )
}

export default BookmarksPage
