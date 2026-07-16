import { useEffect, useState } from 'react'
import SearchResultsList from '../../components/SearchResultsList'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { getBookmarks } from '../../services/bookmarkService'
import styles from './simpleListPage.module.css'

function BookmarksPage() {
  const [papers, setPapers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pageSize = 10

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    async function fetchBookmarks() {
      setLoading(true)
      try {
        const result = await getBookmarks({ page, pageSize })
        setPapers((result?.items ?? []).map((bookmark) => ({
          id: bookmark.paperId,
          title: bookmark.title,
          year: bookmark.publicationYear ?? 'N/A',
          authors: [],
          journal: bookmark.journalName || 'Unknown journal',
          abstract: `${bookmark.citationCount ?? 0} citations · Saved ${new Date(bookmark.savedAt).toLocaleDateString()}`,
        })))
        setTotalPages(result?.totalPages || 1)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load bookmarks')
        setPapers([])
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    fetchBookmarks()
  }, [page])

  return (
    <section className={styles.panel}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Bookmarks</h1>
      </div>
      
      {loading && papers.length === 0 ? (
        <div style={{ marginTop: '1rem' }}>
          <Skeleton variant="card" count={3} />
        </div>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <SearchResultsList papers={papers} />
        </div>
      )}
      
      {totalPages > 1 && !error && (
        <div style={{ marginTop: '2rem', pointerEvents: loading ? 'none' : 'auto' }}>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </section>
  )
}

export default BookmarksPage
