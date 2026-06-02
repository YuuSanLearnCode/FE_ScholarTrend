import { notifications } from '../../data/mockData'
import styles from './simpleListPage.module.css'

function NotificationsPage() {
  return (
    <section className={styles.panel}>
      <h1>Notifications</h1>
      <ul>
        {notifications.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export default NotificationsPage
