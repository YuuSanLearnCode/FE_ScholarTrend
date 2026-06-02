import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchResultsList from '../../components/SearchResultsList'
import { papers } from '../../data/mockData'
import styles from './searchResultsPage.module.css'

function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword')?.toLowerCase().trim() ?? ''
  const author = searchParams.get('author')?.toLowerCase().trim() ?? ''
  const journal = searchParams.get('journal')?.toLowerCase().trim() ?? ''

  const filteredPapers = useMemo(
    () =>
      papers.filter((paper) => {
        const matchesKeyword =
          !keyword ||
          paper.title.toLowerCase().includes(keyword) ||
          paper.abstract.toLowerCase().includes(keyword)
        const matchesAuthor =
          !author || paper.authors.some((name) => name.toLowerCase().includes(author))
        const matchesJournal = !journal || paper.journal.toLowerCase().includes(journal)

        return matchesKeyword && matchesAuthor && matchesJournal
      }),
    [author, journal, keyword],
  )

  return (
    <section>
      <h1>Search Results</h1>
      <p className={styles.summary}>Found {filteredPapers.length} matching paper(s).</p>
      <SearchResultsList papers={filteredPapers} />
    </section>
  )
}

export default SearchResultsPage
