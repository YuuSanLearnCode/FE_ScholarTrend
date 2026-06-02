import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { papers } from '../../data/mockData'
import styles from './paperDetailPage.module.css'

function PaperDetailPage() {
  const { paperId } = useParams()
  const [bookmarked, setBookmarked] = useState(false)

  const paper = useMemo(() => papers.find((item) => item.id === paperId), [paperId])

  if (!paper) {
    return <p>Paper not found.</p>
  }

  return (
    <article className={styles.panel}>
      <h1>{paper.title}</h1>
      <p>
        <strong>Authors:</strong> {paper.authors.join(', ')}
      </p>
      <p>
        <strong>Year:</strong> {paper.year}
      </p>
      <p>
        <strong>Journal:</strong> {paper.journal}
      </p>
      <p>
        <strong>Abstract:</strong> {paper.abstract}
      </p>
      <button type="button" className={styles.button} onClick={() => setBookmarked((prev) => !prev)}>
        {bookmarked ? 'Remove Bookmark' : 'Bookmark Paper'}
      </button>
    </article>
  )
}

export default PaperDetailPage
