import { useEffect, useState } from 'react'
import SearchResultsList from '../../components/SearchResultsList'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { getBookmarks } from '../../services/bookmarkService'
import styles from './simpleListPage.module.css'

function BookmarksPage() {
  const [papers, setPapers] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pageSize = 10

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

  const paginatedPapers = papers.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(papers.length / pageSize))

  if (loading) {
    return (
      <section className={styles.panel}>
        <Skeleton variant="title" width="30%" />
        <Skeleton variant="card" count={3} />
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
      <SearchResultsList papers={paginatedPapers} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </section>
  )
}

export default BookmarksPage
