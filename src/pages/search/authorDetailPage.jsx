import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SearchResultsList from '../../components/SearchResultsList'
import Skeleton from '../../components/Skeleton'
import { getPapersByAuthor } from '../../services/paperService'
import styles from './authorDetailPage.module.css'

function AuthorDetailPage() {
  const { authorName } = useParams()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPapers() {
      setLoading(true)
      setError('')
      try {
        const decodedName = decodeURIComponent(authorName)
        const result = await getPapersByAuthor(decodedName)
        setPapers(result.items ?? result ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load author papers')
        setPapers([])
      } finally {
        setLoading(false)
      }
    }
    fetchPapers()
  }, [authorName])

  if (loading) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="40%" />
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.page}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{decodeURIComponent(authorName)}</h1>
        <p className={styles.subtitle}>
          {papers.length} paper{papers.length !== 1 ? 's' : ''} authored
        </p>
      </div>
      <SearchResultsList papers={papers} />
    </section>
  )
}

export default AuthorDetailPage
