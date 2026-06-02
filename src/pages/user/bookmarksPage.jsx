import SearchResultsList from '../../components/SearchResultsList'
import { papers } from '../../data/mockData'

function BookmarksPage() {
  return (
    <section>
      <h1>My Bookmarks</h1>
      <SearchResultsList papers={papers.slice(0, 2)} />
    </section>
  )
}

export default BookmarksPage
