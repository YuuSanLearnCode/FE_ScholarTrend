import { useEffect, useState } from 'react'
import { getFollowedPapers } from '../services/followService'
import PaperCard from './PaperCard'
import styles from './SearchResultsList.module.css'

function SearchResultsList({ papers }) {
  const [followedPaperIds, setFollowedPaperIds] = useState(new Set())
  const hasToken = Boolean(localStorage.getItem('token'))

  useEffect(() => {
    let active = true

    async function fetchFollowedPapers() {
      if (!hasToken) {
        if (active) setFollowedPaperIds(new Set())
        return
      }

      try {
        // We fetch a large page size here so the UI can check followed status for most papers
        const result = await getFollowedPapers({ page: 1, pageSize: 1000 })
        const followedPapers = result.items ?? []
        if (active) {
          setFollowedPaperIds(
            new Set(
              followedPapers
                .map((paper) => Number(paper.id))
                .filter((paperId) => Number.isInteger(paperId) && paperId > 0),
            ),
          )
        }
      } catch {
        if (active) setFollowedPaperIds(new Set())
      }
    }

    fetchFollowedPapers()

    return () => {
      active = false
    }
  }, [hasToken])

  const handleFollowChange = (paperId, nextIsFollowing) => {
    setFollowedPaperIds((prev) => {
      const next = new Set(prev)
      if (nextIsFollowing) {
        next.add(Number(paperId))
      } else {
        next.delete(Number(paperId))
      }
      return next
    })
  }

  if (!papers.length) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No papers found for the current criteria.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {papers.map((paper) => (
        <PaperCard
          key={paper.id}
          paper={paper}
          canFollow={hasToken}
          isFollowing={followedPaperIds.has(Number(paper.id))}
          onFollowChange={handleFollowChange}
        />
      ))}
    </div>
  )
}

export default SearchResultsList
