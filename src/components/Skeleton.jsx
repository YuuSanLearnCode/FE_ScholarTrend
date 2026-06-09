import styles from './Skeleton.module.css'

function Skeleton({ variant = 'text', width, height, count = 1 }) {
  if (count > 1) {
    return (
      <div className={styles.group}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={`${styles.base} ${styles[variant]}`}
            style={{ width, height }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${styles.base} ${styles[variant]}`}
      style={{ width, height }}
    />
  )
}

export default Skeleton
