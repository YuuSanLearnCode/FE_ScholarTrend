import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './searchPage.module.css'

function SearchPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ keyword: '', author: '', journal: '' })

  const handleSubmit = (event) => {
    event.preventDefault()
    const params = new URLSearchParams(form)
    navigate(`/search/results?${params.toString()}`)
  }

  return (
    <section className={styles.panel}>
      <h1>Search Publications</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="keyword">Keyword</label>
        <input
          id="keyword"
          className={styles.input}
          value={form.keyword}
          onChange={(event) => setForm((prev) => ({ ...prev, keyword: event.target.value }))}
        />
        <label htmlFor="author">Author</label>
        <input
          id="author"
          className={styles.input}
          value={form.author}
          onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
        />
        <label htmlFor="journal">Journal</label>
        <input
          id="journal"
          className={styles.input}
          value={form.journal}
          onChange={(event) => setForm((prev) => ({ ...prev, journal: event.target.value }))}
        />
        <button type="submit" className={styles.button}>
          Search
        </button>
      </form>
    </section>
  )
}

export default SearchPage
