import { Link } from 'react-router-dom'
import styles from './PremiumGate.module.css'

/**
 * Shared premium gate banner.
 * Shows a clean upgrade prompt when the user doesn't have the required plan.
 *
 * @param {string} title     - Feature name (e.g. "Gap Analysis")
 * @param {string} message   - Short description of what they're missing
 * @param {string} [to]      - Link target, defaults to /pricing
 */
export default function PremiumGate({ title, message, to = '/pricing' }) {
  return (
    <div className={styles.box}>
      <div className={styles.icon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <div className={styles.content}>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      <Link to={to} className={styles.btn}>
        View Subscription Plans
      </Link>
    </div>
  )
}
