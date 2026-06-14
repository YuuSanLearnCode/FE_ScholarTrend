import api from './api'

function unwrapResponse(response, fallbackMessage) {
  if (!response.success || response.data == null) {
    throw new Error(response.message || response.errors?.[0] || fallbackMessage)
  }

  return response.data
}

function normalizeFollow(item, fallbackType) {
  const targetId = item.targetId ?? item.id

  return {
    ...item,
    followId: item.id,
    id: targetId,
    name: item.name ?? `${fallbackType} ${targetId}`,
    type: item.type ?? fallbackType,
    followedAt: item.followedAt ?? null,
  }
}

/** Lấy danh sách topics đang follow */
export async function getFollowedTopics() {
  const { data: response } = await api.get('/follows/topics')
  const result = unwrapResponse(response, 'Failed to load followed topics.')

  return (Array.isArray(result) ? result : []).map((item) => normalizeFollow(item, 'Topic'))
}

/** Follow 1 topic */
export async function followTopic(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Invalid topic id.')
  }

  const { data: response } = await api.post(`/follows/topics/${normalizedTopicId}`)
  const result = unwrapResponse(response, 'Failed to follow topic.')
  return normalizeFollow(result, 'Topic')
}

/** Unfollow 1 topic */
export async function unfollowTopic(topicId) {
  const normalizedTopicId = Number(topicId)
  if (!Number.isInteger(normalizedTopicId) || normalizedTopicId <= 0) {
    throw new Error('Invalid topic id.')
  }

  const { data: response } = await api.delete(`/follows/topics/${normalizedTopicId}`)
  return unwrapResponse(response, 'Failed to unfollow topic.')
}

/** Lấy danh sách journals đang follow */
export async function getFollowedJournals() {
  const { data: response } = await api.get('/follows/journals')
  const result = unwrapResponse(response, 'Failed to load followed journals.')

  return (Array.isArray(result) ? result : []).map((item) => normalizeFollow(item, 'Journal'))
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
