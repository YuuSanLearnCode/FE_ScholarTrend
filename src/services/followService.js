import api from './api'

/** Lấy danh sách topics đang follow */
export async function getFollowedTopics() {
  const { data } = await api.get('/following/topics')
  return data
}

/** Follow 1 topic */
export async function followTopic(topicId) {
  const { data } = await api.post('/following/topics', { topicId })
  return data
}

/** Unfollow 1 topic */
export async function unfollowTopic(topicId) {
  await api.delete(`/following/topics/${topicId}`)
}

/** Lấy danh sách journals đang follow */
export async function getFollowedJournals() {
  const { data } = await api.get('/following/journals')
  return data
}

/** Follow 1 journal */
export async function followJournal(journalId) {
  const { data } = await api.post('/following/journals', { journalId })
  return data
}

/** Unfollow 1 journal */
export async function unfollowJournal(journalId) {
  await api.delete(`/following/journals/${journalId}`)
}
