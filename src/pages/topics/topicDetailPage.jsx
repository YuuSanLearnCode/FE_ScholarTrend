import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import SearchResultsList from '../../components/SearchResultsList'
import Skeleton from '../../components/Skeleton'
import {
  followTopic,
  getFollowedTopics,
  unfollowTopic,
} from '../../services/followService'
import {
  getTopicById,
  getTopicGapById,
  getTopicGapEvidences,
  getTopicGapList,
  getTopicGaps,
} from '../../services/topicService'
import styles from './topicDetailPage.module.css'

function formatPeriod(point) {
  if (!point.month) return String(point.year)
  return `${String(point.month).padStart(2, '0')}/${point.year}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function formatPercent(value) {
  const number = Number(value ?? 0)
  if (Number.isNaN(number)) return '0%'

  return `${number % 1 === 0 ? number.toFixed(0) : number.toFixed(1)}%`
}

function formatConfidence(value) {
  const number = Number(value ?? 0)
  if (Number.isNaN(number)) return '0%'

  return formatPercent(number <= 1 ? number * 100 : number)
}

function formatDateTime(value) {
  if (!value) return 'Not analyzed yet'
  let dateString = value;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    dateString += 'Z';
  }
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Not analyzed yet'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function AiInferredText({ text = '' }) {
  if (typeof text !== 'string') return <>{text}</>
  const inferredTag = '[AI Inferred]'
  if (text.includes(inferredTag)) {
    const cleanText = text.replace(inferredTag, '').trim()
    return (
      <span className={styles.aiInferredWrapper}>
        {cleanText}{' '}
        <span
          className={styles.aiIcon}
          title="This data is inferred by AI and is for reference only."
          style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}
        >
          (🤖 AI)
        </span>
      </span>
    )
  }
  return <>{text}</>
}

function TopicDetailPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState(null)
  const [gapDashboard, setGapDashboard] = useState(null)
  const [gapList, setGapList] = useState(null)
  const [selectedGapDetail, setSelectedGapDetail] = useState(null)
  const [selectedGapEvidences, setSelectedGapEvidences] = useState(null)
  const [selectedGapId, setSelectedGapId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gapError, setGapError] = useState('')
  const [gapListError, setGapListError] = useState('')
  const [gapDetailError, setGapDetailError] = useState('')
  const [gapEvidenceError, setGapEvidenceError] = useState('')
  const [gapDetailLoading, setGapDetailLoading] = useState(false)
  const [gapEvidenceLoading, setGapEvidenceLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')

  useEffect(() => {
    async function fetchTopic() {
      setLoading(true)
      setError('')
      setGapDashboard(null)
      setGapList(null)
      setSelectedGapDetail(null)
      setSelectedGapEvidences(null)
      setSelectedGapId(null)
      setGapError('')
      setGapListError('')
      setGapDetailError('')
      setGapEvidenceError('')
      setFollowError('')
      setIsFollowing(false)
      try {
        const hasToken = Boolean(localStorage.getItem('token'))
        const [topicResponse, gapsResponse, gapListResponse] = await Promise.allSettled([
          getTopicById(topicId),
          getTopicGaps(topicId),
          getTopicGapList(topicId),
        ])

        if (topicResponse.status === 'rejected') {
          throw topicResponse.reason
        }

        const topicResult = topicResponse.value
        setTopic(topicResult)

        if (gapsResponse.status === 'fulfilled') {
          setGapDashboard(gapsResponse.value)
        } else {
          setGapDashboard(null)
          if (gapsResponse.reason?.response?.status === 403 || gapsResponse.reason?.message?.includes('403')) {
            setGapError('⭐ Premium Feature: Please upgrade to a Researcher account to unlock and view the Generated Gap Analysis.')
          } else {
            setGapError(
              gapsResponse.reason?.response?.data?.message ||
              gapsResponse.reason?.message ||
              'Could not load topic gap dashboard.',
            )
          }
        }

        if (gapListResponse.status === 'fulfilled') {
          setGapList(gapListResponse.value)
        } else {
          setGapList(null)
          if (gapListResponse.reason?.response?.status === 403 || gapListResponse.reason?.message?.includes('403')) {
            setGapListError('⭐ Premium Feature: Please upgrade to a Researcher account to view research opportunities.')
          } else {
            setGapListError(
              gapListResponse.reason?.response?.data?.message ||
              gapListResponse.reason?.message ||
              'Could not load topic gap list.',
            )
          }
        }

        if (hasToken) {
          try {
            const followedResult = await getFollowedTopics({ page: 1, pageSize: 1000 })
            const followedTopics = followedResult?.items ?? []
            setIsFollowing(
              followedTopics.some((item) => Number(item.id) === Number(topicId)),
            )
          } catch (followErr) {
            setFollowError(
              followErr.response?.data?.message ||
              followErr.message ||
              'Could not load follow status.',
            )
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load topic details.')
        setTopic(null)
        setGapDashboard(null)
        setGapList(null)
        setSelectedGapDetail(null)
        setSelectedGapEvidences(null)
        setSelectedGapId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTopic()
  }, [topicId])

  const handleFollowToggle = async () => {
    setFollowLoading(true)
    setFollowError('')
    try {
      if (isFollowing) {
        await unfollowTopic(topicId)
        setIsFollowing(false)
      } else {
        await followTopic(topicId)
        setIsFollowing(true)
      }
    } catch (err) {
      setFollowError(
        err.response?.data?.message ||
        err.message ||
        `Failed to ${isFollowing ? 'unfollow' : 'follow'} topic.`,
      )
    } finally {
      setFollowLoading(false)
    }
  }

  const handleGapDetailOpen = async (gap) => {
    if (!gap?.id) {
      setGapDetailError('This gap does not have a valid id.')
      return
    }

    setSelectedGapId(gap.id)
    setSelectedGapDetail(gap)
    setSelectedGapEvidences(Array.isArray(gap.evidences) ? gap.evidences : [])
    setGapDetailError('')
    setGapEvidenceError('')
    setGapDetailLoading(true)
    setGapEvidenceLoading(true)

    try {
      const [detailResponse, evidenceResponse] = await Promise.allSettled([
        getTopicGapById(gap.id),
        getTopicGapEvidences(gap.id),
      ])

      if (detailResponse.status === 'fulfilled') {
        setSelectedGapDetail(detailResponse.value)
      } else {
        setGapDetailError(
          detailResponse.reason?.response?.data?.message ||
          detailResponse.reason?.message ||
          'Could not load gap details.',
        )
      }

      if (evidenceResponse.status === 'fulfilled') {
        setSelectedGapEvidences(evidenceResponse.value)
      } else {
        if (detailResponse.status === 'fulfilled') {
          setSelectedGapEvidences(detailResponse.value.evidences)
        }
        setGapEvidenceError(
          evidenceResponse.reason?.response?.data?.message ||
          evidenceResponse.reason?.message ||
          'Could not load gap evidences.',
        )
      }
    } finally {
      setGapDetailLoading(false)
      setGapEvidenceLoading(false)
    }
  }

  const handleGapDetailClose = () => {
    setSelectedGapId(null)
    setSelectedGapDetail(null)
    setSelectedGapEvidences(null)
    setGapDetailError('')
    setGapEvidenceError('')
    setGapDetailLoading(false)
    setGapEvidenceLoading(false)
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/search')
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="45%" />
        <div className={styles.loadingChart}><Skeleton variant="chart" /></div>
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error || !topic) {
    return (
      <section className={styles.page}>
        <div className={styles.errorState}>
          <strong>Topic could not be loaded</strong>
          <p>{error}</p>
          <Link to="/trends">Back to trends</Link>
        </div>
      </section>
    )
  }

  const trendData = topic.trendChart.map((point) => ({
    ...point,
    period: formatPeriod(point),
  }))
  const totalCitations = trendData.reduce(
    (sum, point) => sum + (point.citationCount ?? 0),
    0,
  )
  const averageGrowth = trendData.length
    ? trendData.reduce((sum, point) => sum + (point.growthRate ?? 0), 0) / trendData.length
    : 0
  const peakScore = Math.max(0, ...trendData.map((point) => point.trendingScore ?? 0))
  const hasGapList = Array.isArray(gapList)
  const topicGapItems = hasGapList ? gapList : gapDashboard?.gaps ?? []
  const gapCoverage = gapDashboard?.coverage ?? null
  const gapPatterns = gapDashboard?.patterns ?? null
  const gapTimeline = gapDashboard?.timeline?.timeline ?? []
  const hasGapContent = gapDashboard || hasGapList
  const selectedPatterns = selectedGapDetail?.supportingPatterns ?? null
  const selectedTrend = selectedGapDetail?.trendInfo ?? null
  const selectedRelatedPapers = selectedGapDetail?.topRelatedPapers ?? []
  const selectedEvidences = selectedGapEvidences ?? selectedGapDetail?.evidences ?? []

  return (
    <section className={styles.page}>
      <button type="button" className={styles.backButton} onClick={handleBack}>
        <span aria-hidden="true">&larr;</span>
        Back
      </button>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Research topic</span>
          <h1>{topic.name}</h1>
          <p>{topic.description || 'No description is available for this topic.'}</p>
        </div>
        <div className={styles.heroActions}>
          {localStorage.getItem('token') ? (
            <button
              type="button"
              className={`${styles.followButton} ${isFollowing ? styles.followingButton : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading
                ? isFollowing ? 'Unfollowing...' : 'Following...'
                : isFollowing ? 'Unfollow topic' : 'Follow topic'}
            </button>
          ) : (
            <Link className={styles.followButton} to="/login">Sign in to follow</Link>
          )}
          <Link
            className={styles.primaryLink}
            to={`/search/results?topicId=${topic.id}&topicName=${encodeURIComponent(topic.name)}&page=1&pageSize=10`}
          >
            View all papers
          </Link>
        </div>
      </header>

      {followError && <p className={styles.followError}>{followError}</p>}

      <div className={styles.statsGrid}>
        <article>
          <span>Papers</span>
          <strong>{formatNumber(topic.paperCount)}</strong>
        </article>
        <article>
          <span>Citations</span>
          <strong>{formatNumber(totalCitations)}</strong>
        </article>
        <article>
          <span>Average growth</span>
          <strong>{averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%</strong>
        </article>
        <article>
          <span>Peak trend score</span>
          <strong>{peakScore.toFixed(2)}</strong>
        </article>
      </div>

      <article className={`${styles.panel} ${styles.gapPanel}`}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Research gaps</span>
            <h2>Generated gap analysis</h2>
          </div>
          <span className={styles.analyzedAt}>
            Generated: {formatDateTime(gapDashboard?.generatedAt)}
          </span>
        </div>

        {gapError && <p className={styles.insightsError}>{gapError}</p>}
        {gapListError && <p className={styles.insightsError}>{gapListError}</p>}

        {hasGapContent ? (
          <>
            {gapCoverage && (
              <div className={styles.coverageGrid}>
                <article>
                  <span>Total papers</span>
                  <strong>{formatNumber(gapCoverage.totalPapers)}</strong>
                </article>
                <article>
                  <span>PDF analyzed</span>
                  <strong>{formatNumber(gapCoverage.pdfAnalyzedPapers)}</strong>
                </article>
                <article>
                  <span>Abstract analyzed</span>
                  <strong>{formatNumber(gapCoverage.abstractAnalyzedPapers)}</strong>
                </article>
                <article>
                  <span>Coverage</span>
                  <strong>{formatPercent(gapCoverage.coveragePercentage)}</strong>
                </article>
                <article>
                  <span>Full text coverage</span>
                  <strong>{formatPercent(gapCoverage.fullTextCoveragePercentage)}</strong>
                </article>
                <article>
                  <span>Ignored papers</span>
                  <strong>{formatNumber(gapCoverage.ignoredPapers)}</strong>
                </article>
              </div>
            )}

            <section className={styles.gapSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>Generated gaps</span>
                  <h2>Research opportunities</h2>
                </div>
                <span>{topicGapItems.length} gaps</span>
              </div>

              {topicGapItems.length > 0 ? (
                <div className={styles.gapList}>
                  {topicGapItems.map((gap, index) => (
                    <article className={styles.gapCard} key={gap.id ? gap.id : `${gap.title}-${index}`}>
                      <div className={styles.gapCardTop}>
                        <div>
                          <h3><AiInferredText text={gap.title || 'Untitled gap'} /></h3>
                          <p><AiInferredText text={gap.description || 'No description available.'} /></p>
                        </div>
                        <span>{gap.confidenceLevel || 'Unknown'}</span>
                      </div>

                      <div className={styles.gapMeta}>
                        <span>{gap.gapType || 'Gap'}</span>
                        <span>{formatNumber(gap.evidenceCount)} evidences</span>
                        <span>{formatConfidence(gap.confidence)} confidence</span>
                      </div>

                      {gap.suggestedDirection && (
                        <div className={styles.directionBox}>
                          <strong>Suggested direction</strong>
                          <p><AiInferredText text={gap.suggestedDirection} /></p>
                        </div>
                      )}

                      {Array.isArray(gap.evidences) && gap.evidences.length > 0 && (
                        <div className={styles.gapEvidenceList}>
                          {gap.evidences.slice(0, 3).map((evidence, evIdx) => (
                            <Link
                              key={evidence.id ? evidence.id : `${gap.id}-${evidence.paperId}-${evIdx}`}
                              to={`/papers/${evidence.paperId}`}
                            >
                              <strong>{evidence.paperTitle || `Paper #${evidence.paperId}`}</strong>
                              <span>
                                {[evidence.authors, evidence.year].filter(Boolean).join(' - ') || 'Unknown source'}
                              </span>
                              <p>
                                <AiInferredText text={evidence.evidenceSentence || 'View supporting evidence.'} />
                              </p>
                            </Link>
                          ))}
                        </div>
                      )}

                      <div className={styles.gapActions}>
                        <button
                          type="button"
                          onClick={() => handleGapDetailOpen(gap)}
                          disabled={!gap.id || (selectedGapId === gap.id && (gapDetailLoading || gapEvidenceLoading))}
                        >
                          {selectedGapId === gap.id && (gapDetailLoading || gapEvidenceLoading)
                            ? 'Loading details...'
                            : 'View gap details'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyInline}>No generated gaps are available for this topic.</p>
              )}
            </section>

            <div className={styles.gapInsightGrid}>
              <section>
                <h3>Top methods</h3>
                <div className={styles.compactList}>
                  {(gapPatterns?.methods ?? []).length > 0 ? (
                    gapPatterns.methods.slice(0, 5).map((item) => (
                      <span key={`${item.methodName}-${item.year}`}>
                        <strong><AiInferredText text={item.methodName || 'Unknown method'} /></strong>
                        <small>{formatNumber(item.paperCount)} papers - {item.trend || 'stable'}</small>
                      </span>
                    ))
                  ) : (
                    <p>No methods mined.</p>
                  )}
                </div>
              </section>
              <section>
                <h3>Datasets</h3>
                <div className={styles.compactList}>
                  {(gapPatterns?.datasets ?? []).length > 0 ? (
                    gapPatterns.datasets.slice(0, 5).map((item) => (
                      <span key={`${item.datasetName}-${item.year}`}>
                        <strong><AiInferredText text={item.datasetName || 'Unknown dataset'} /></strong>
                        <small>{formatNumber(item.paperCount)} papers - {item.trend || 'stable'}</small>
                      </span>
                    ))
                  ) : (
                    <p>No datasets mined.</p>
                  )}
                </div>
              </section>
              <section>
                <h3>Limitations</h3>
                <div className={styles.compactList}>
                  {(gapPatterns?.limitations ?? []).length > 0 ? (
                    gapPatterns.limitations.slice(0, 5).map((item) => (
                      <span key={`${item.limitationText}-${item.year}`}>
                        <strong><AiInferredText text={item.limitationText || 'Unknown limitation'} /></strong>
                        <small>{formatNumber(item.paperCount)} papers - {item.trend || 'stable'}</small>
                      </span>
                    ))
                  ) : (
                    <p>No limitations mined.</p>
                  )}
                </div>
              </section>
            </div>

            {gapTimeline.length > 0 && (
              <section className={styles.gapTimelinePanel}>
                <h3>Gap timeline</h3>
                <div className={styles.gapTimelineList}>
                  {gapTimeline.map((item) => (
                    <article key={`${item.year}-${item.gapTitle}`}>
                      <strong>{item.year || 'N/A'}</strong>
                      <div>
                        <h4><AiInferredText text={item.gapTitle || 'Untitled gap'} /></h4>
                        <p>
                          {item.gapType || 'Gap'} - {formatNumber(item.paperCount)} papers - {item.trend || 'stable'}
                        </p>
                      </div>
                      <span className={item.isResolved ? styles.resolvedBadge : styles.openBadge}>
                        {item.isResolved ? 'Resolved' : 'Open'}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className={styles.emptyInline}>No gap data is available for this topic.</p>
        )}
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Topic performance</span>
            <h2>Publication and citation trend</h2>
          </div>
        </div>
        <div className={styles.chart}>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                <Line type="monotone" dataKey="paperCount" name="Papers" stroke="#1e40af" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="citationCount" name="Citations" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>No trend data is available for this topic.</p>
          )}
        </div>
      </article>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Latest research</span>
            <h2>Recent papers</h2>
          </div>
          <span>{topic.recentPapers.length} shown</span>
        </div>
        <SearchResultsList papers={topic.recentPapers} />
      </section>

      {selectedGapId && (
        <div className={styles.modalOverlay} role="presentation" onClick={handleGapDetailClose}>
          <article
            className={styles.gapDetailModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gap-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.gapDetailHeader}>
              <div>
                <span className={styles.eyebrow}>Gap details</span>
                <h2 id="gap-detail-title">
                  <AiInferredText text={selectedGapDetail?.title || 'Gap details'} />
                </h2>
                <p>
                  <AiInferredText text={selectedGapDetail?.description || 'No description available.'} />
                </p>
              </div>
              <button type="button" className={styles.modalCloseButton} onClick={handleGapDetailClose}>
                Close
              </button>
            </header>

            {gapDetailLoading && <p className={styles.loadingInline}>Loading gap details...</p>}
            {gapEvidenceLoading && <p className={styles.loadingInline}>Loading gap evidences...</p>}
            {gapDetailError && <p className={styles.insightsError}>{gapDetailError}</p>}
            {gapEvidenceError && <p className={styles.insightsError}>{gapEvidenceError}</p>}

            {selectedGapDetail && (
              <>
                <div className={styles.gapMeta}>
                  <span>{selectedGapDetail.gapType || 'Gap'}</span>
                  <span>{formatNumber(selectedGapDetail.evidenceCount)} evidences</span>
                  <span>{formatConfidence(selectedGapDetail.confidence)} confidence</span>
                  <span>{selectedGapDetail.confidenceLevel || 'Unknown'}</span>
                </div>

                {selectedGapDetail.suggestedDirection && (
                  <div className={styles.directionBox}>
                    <strong>Suggested direction</strong>
                    <p><AiInferredText text={selectedGapDetail.suggestedDirection} /></p>
                  </div>
                )}

                <div className={styles.gapDetailGrid}>
                  <section className={styles.detailBlock}>
                    <h3>Trend info</h3>
                    {selectedTrend ? (
                      <dl className={styles.detailStats}>
                        <div>
                          <dt>Year</dt>
                          <dd>{selectedTrend.year || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>{selectedTrend.isResolved ? 'Resolved' : 'Open'}</dd>
                        </div>
                        <div>
                          <dt>Papers</dt>
                          <dd>{formatNumber(selectedTrend.paperCount)}</dd>
                        </div>
                        <div>
                          <dt>Growth</dt>
                          <dd>{formatPercent(selectedTrend.growthRate)}</dd>
                        </div>
                      </dl>
                    ) : (
                      <p className={styles.emptyInline}>No trend info available.</p>
                    )}
                  </section>

                  <section className={styles.detailBlock}>
                    <h3>Top related papers</h3>
                    {selectedRelatedPapers.length > 0 ? (
                      <div className={styles.relatedPaperList}>
                        {selectedRelatedPapers.map((paper) => (
                          <Link key={paper.paperId || paper.title} to={`/papers/${paper.paperId}`}>
                            <strong>{paper.title || `Paper #${paper.paperId}`}</strong>
                            <span>
                              {[paper.authors, paper.year, `${formatNumber(paper.citationCount)} citations`]
                                .filter(Boolean)
                                .join(' - ')}
                            </span>
                            <p><AiInferredText text={paper.contribution || 'View related paper.'} /></p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.emptyInline}>No related papers available.</p>
                    )}
                  </section>
                </div>

                <section className={styles.detailBlock}>
                  <h3>Evidence</h3>
                  {selectedEvidences.length > 0 ? (
                    <div className={styles.gapEvidenceList}>
                      {selectedEvidences.map((evidence) => (
                        <Link
                          key={evidence.id || `${selectedGapDetail.id}-${evidence.paperId}`}
                          to={`/papers/${evidence.paperId}`}
                        >
                          <strong>{evidence.paperTitle || `Paper #${evidence.paperId}`}</strong>
                          <span>
                            {[evidence.authors, evidence.year, evidence.evidenceType, evidence.sectionSource]
                              .filter(Boolean)
                              .join(' - ')}
                          </span>
                          <p>
                            <AiInferredText text={evidence.evidenceSentence || 'View supporting evidence.'} />
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyInline}>No evidence available.</p>
                  )}
                </section>

                <section className={styles.detailBlock}>
                  <h3>Supporting patterns</h3>
                  {selectedPatterns ? (
                    <div className={styles.patternColumns}>
                      <div>
                        <h4>Methods</h4>
                        <div className={styles.compactList}>
                          {(selectedPatterns.methods ?? []).length > 0 ? (
                            selectedPatterns.methods.slice(0, 4).map((item) => (
                              <span key={`${item.methodName}-${item.year}`}>
                                <strong><AiInferredText text={item.methodName || 'Unknown method'} /></strong>
                                <small>{formatNumber(item.paperCount)} papers - {item.trend || 'stable'}</small>
                              </span>
                            ))
                          ) : (
                            <p>No methods found.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4>Datasets</h4>
                        <div className={styles.compactList}>
                          {(selectedPatterns.datasets ?? []).length > 0 ? (
                            selectedPatterns.datasets.slice(0, 4).map((item) => (
                              <span key={`${item.datasetName}-${item.year}`}>
                                <strong><AiInferredText text={item.datasetName || 'Unknown dataset'} /></strong>
                                <small>{formatNumber(item.paperCount)} papers - {item.trend || 'stable'}</small>
                              </span>
                            ))
                          ) : (
                            <p>No datasets found.</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4>Limitations</h4>
                        <div className={styles.compactList}>
                          {(selectedPatterns.limitations ?? []).length > 0 ? (
                            selectedPatterns.limitations.slice(0, 4).map((item) => (
                              <span key={`${item.limitationText}-${item.year}`}>
                                <strong><AiInferredText text={item.limitationText || 'Unknown limitation'} /></strong>
                                <small>{formatNumber(item.paperCount)} papers - {item.trend || 'stable'}</small>
                              </span>
                            ))
                          ) : (
                            <p>No limitations found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.emptyInline}>No supporting patterns available.</p>
                  )}
                </section>
              </>
            )}
          </article>
        </div>
      )}
    </section>
  )
}

export default TopicDetailPage
