import styles from './StatsCard.module.css'

function StatsCard({ label, value, detail, tone = 'blue' }) {
  const toneClass = styles[tone] ?? styles.blue

  return (
    <article className={`${styles.card} ${toneClass}`}>
      <div>
        <p className={styles.label}>{label}</p>
        <h3 className={styles.value}>{value}</h3>
      </div>
      {detail && <p className={styles.detail}>{detail}</p>}
    </article>
  )
}

export default StatsCard
