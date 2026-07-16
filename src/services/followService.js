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
    type: fallbackType, // Always enforce the fallbackType (Topic, Author, Paper, Journal)
    followedAt: item.followedAt ?? null,
  }
}

export async function getFollowCounts() {
  const { data: response } = await api.get('/follows/counts')
  return unwrapResponse(response, 'Failed to load follow counts.')
}

/** Lấy danh sách topics đang follow */
export async function getFollowedTopics({ page = 1, pageSize = 10 } = {}) {
  const { data: response } = await api.get('/follows/topics', { params: { page, pageSize } })
  const result = unwrapResponse(response, 'Failed to load followed topics.')

  return {
    ...result,
    items: (Array.isArray(result.items) ? result.items : []).map((item) => normalizeFollow(item, 'Topic'))
  }
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
export async function getFollowedJournals({ page = 1, pageSize = 10 } = {}) {
  const { data: response } = await api.get('/follows/journals', { params: { page, pageSize } })
  const result = unwrapResponse(response, 'Failed to load followed journals.')

  return {
    ...result,
    items: (Array.isArray(result.items) ? result.items : []).map((item) => normalizeFollow(item, 'Journal'))
  }
}

/** Follow 1 journal */
export async function followJournal(journalId) {
  const normalizedJournalId = Number(journalId)
  if (!Number.isInteger(normalizedJournalId) || normalizedJournalId <= 0) {
    throw new Error('Invalid journal id.')
  }

  const { data: response } = await api.post(`/follows/journals/${normalizedJournalId}`)
  const result = unwrapResponse(response, 'Failed to follow journal.')
  return normalizeFollow(result, 'Journal')
}

/** Unfollow 1 journal */
export async function unfollowJournal(journalId) {
  const normalizedJournalId = Number(journalId)
  if (!Number.isInteger(normalizedJournalId) || normalizedJournalId <= 0) {
    throw new Error('Invalid journal id.')
  }

  const { data: response } = await api.delete(`/follows/journals/${normalizedJournalId}`)
  return unwrapResponse(response, 'Failed to unfollow journal.')
}

export async function getFollowedAuthors({ page = 1, pageSize = 10 } = {}) {
  const { data: response } = await api.get('/follows/authors', { params: { page, pageSize } })
  const result = unwrapResponse(response, 'Failed to load followed authors.')

  return {
    ...result,
    items: (Array.isArray(result.items) ? result.items : []).map((item) => normalizeFollow(item, 'Author'))
  }
}

export async function followAuthor(authorId) {
  const normalizedAuthorId = Number(authorId)
  if (!Number.isInteger(normalizedAuthorId) || normalizedAuthorId <= 0) {
    throw new Error('Invalid author id.')
  }

  const { data: response } = await api.post(`/follows/authors/${normalizedAuthorId}`)
  const result = unwrapResponse(response, 'Failed to follow author.')
  return normalizeFollow(result, 'Author')
}

export async function unfollowAuthor(authorId) {
  const normalizedAuthorId = Number(authorId)
  if (!Number.isInteger(normalizedAuthorId) || normalizedAuthorId <= 0) {
    throw new Error('Invalid author id.')
  }

  const { data: response } = await api.delete(`/follows/authors/${normalizedAuthorId}`)
  return unwrapResponse(response, 'Failed to unfollow author.')
}

export async function getFollowedPapers({ page = 1, pageSize = 10 } = {}) {
  const { data: response } = await api.get('/follows/papers', { params: { page, pageSize } })
  const result = unwrapResponse(response, 'Failed to load followed papers.')

  return {
    ...result,
    items: (Array.isArray(result.items) ? result.items : []).map((item) => normalizeFollow(item, 'Paper'))
  }
}

export async function followPaper(paperId) {
  const normalizedPaperId = Number(paperId)
  if (!Number.isInteger(normalizedPaperId) || normalizedPaperId <= 0) {
    throw new Error('Invalid paper id.')
  }

  const { data: response } = await api.post(`/follows/papers/${normalizedPaperId}`)
  const result = unwrapResponse(response, 'Failed to follow paper.')
  return normalizeFollow(result, 'Paper')
}

export async function unfollowPaper(paperId) {
  const normalizedPaperId = Number(paperId)
  if (!Number.isInteger(normalizedPaperId) || normalizedPaperId <= 0) {
    throw new Error('Invalid paper id.')
  }

  const { data: response } = await api.delete(`/follows/papers/${normalizedPaperId}`)
  return unwrapResponse(response, 'Failed to unfollow paper.')
}
