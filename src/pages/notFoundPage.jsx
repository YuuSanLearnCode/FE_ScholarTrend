import { Link } from 'react-router-dom'
import styles from './notFoundPage.module.css'

function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.message}>Page not found</p>
        <p className={styles.hint}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className={styles.button}>Back to Home</Link>
      </div>
    </section>
  )
}

export default NotFoundPage
