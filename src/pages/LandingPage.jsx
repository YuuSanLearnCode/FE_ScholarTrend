import { Link } from 'react-router-dom'
import styles from './landingPage.module.css'

function LandingPage() {
  return (
    <section className={styles.hero}>
      <p className={styles.badge}>Scientific Journal Publication Trend Tracking System</p>
      <h1>Discover publication trends with ScholarTrend.</h1>
      <p>
        Search papers, visualize publication activity by year, and keep your personalized watchlist
        updated.
      </p>
      <div className={styles.actions}>
        <Link to="/search" className={styles.primary}>
          Start Searching
        </Link>
        <Link to="/register" className={styles.secondary}>
          Create Account
        </Link>
      </div>
    </section>
  )
}

export default LandingPage
