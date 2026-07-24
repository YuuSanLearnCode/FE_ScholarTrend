import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getJournalTrends,
  getKeywordTrends,
  getTopJournalTrends,
  getTopKeywordTrends,
  getTopTopicTrends,
  getTopicTrends,
  getTrendDashboard,
} from '../../services/trendService'
import Skeleton from '../../components/Skeleton'
import PublicationReportPage from '../reports/publicationReportPage'
import styles from './trendChartPage.module.css'

const COLORS = ['#1e40af', '#0891b2', '#16a34a', '#d97706', '#7c3aed', '#db2777']
const MONTHS = [
  { value: '', label: 'Any month' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]
const EMPTY_DASHBOARD = {
  topKeywords: [],
  topTopics: [],
  topJournals: [],
  publicationTrend: [],
}

function getInitialFilters() {
  const currentYear = new Date().getFullYear()
  return {
    yearFrom: String(currentYear - 5),
    yearTo: String(currentYear),
    monthFrom: '',
    monthTo: '',
    keywordId: '',
    topicId: '',
    journalId: '',
    top: '10',
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function formatPeriod(item) {
  if (!item?.year) return 'Unknown'
  if (!item.month) return String(item.year)
  return `${String(item.month).padStart(2, '0')}/${item.year}`
}

function formatGrowth(growthRate) {
  const value = Number(growthRate) || 0
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function getGrowthClass(growthRate) {
  if (growthRate > 0) return styles.positive
  if (growthRate < 0) return styles.negative
  return styles.neutral
}

function getPeriodKey(item) {
  return `${Number(item.year) || 0}-${String(Number(item.month) || 0).padStart(2, '0')}`
}

function getEntityLink(type, item) {
  if (type === 'keyword') {
    return `/search/results?keyword=${encodeURIComponent(item.name)}&searchType=Keyword&page=1&pageSize=10`
  }
  if (type === 'topic') return `/topics/${item.id}`
  return `/journals/${item.id}`
}

function getSeriesTotal(series, metric) {
  return (series?.dataPoints ?? []).reduce((sum, point) => sum + (point[metric] ?? 0), 0)
}

function buildSeriesChartData(series, metric, keyPrefix) {
  const periods = new Map()

  series.forEach((item) => {
    ;(item.dataPoints ?? []).forEach((point) => {
      const key = getPeriodKey(point)
      const current = periods.get(key) ?? {
        sortKey: key,
        period: formatPeriod(point),
      }
      current[`${keyPrefix}_${item.id}`] = point[metric] ?? 0
      periods.set(key, current)
    })
  })

  return Array.from(periods.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
}

function buildEntityOptions(...groups) {
  const options = new Map()

  groups.flat().forEach((item) => {
    if (!item?.id || !item.name || options.has(item.id)) return
    options.set(item.id, {
      id: item.id,
      name: item.name,
    })
  })

  return Array.from(options.values())
}

function buildSeriesColorMap(series) {
  const colors = new Map()

  series.forEach((item, index) => {
    const color = COLORS[index % COLORS.length]
    if (item?.id) colors.set(`id:${item.id}`, color)
    if (item?.name) colors.set(`name:${item.name}`, color)
  })

  return colors
}

function TrendChartPage() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD)
  const [keywordSeries, setKeywordSeries] = useState([])
  const [keywordMetric, setKeywordMetric] = useState('paperCount')
  const [topicSeries, setTopicSeries] = useState([])
  const [topicMetric, setTopicMetric] = useState('paperCount')
  const [journalSeries, setJournalSeries] = useState([])
  const [journalMetric, setJournalMetric] = useState('paperCount')
  const [filters, setFilters] = useState(getInitialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTrendData = async (nextFilters) => {
    setLoading(true)
    setError('')
    try {
      const [
        dashboardResult,
        keywordResult,
        topKeywordResult,
        topicResult,
        topTopicResult,
        journalResult,
        topJournalResult,
      ] = await Promise.all([
        getTrendDashboard(nextFilters),
        getKeywordTrends(nextFilters),
        getTopKeywordTrends(nextFilters),
        getTopicTrends(nextFilters),
        getTopTopicTrends(nextFilters),
        getJournalTrends(nextFilters),
        getTopJournalTrends(nextFilters),
      ])
      setDashboard({
        ...dashboardResult,
        topKeywords: topKeywordResult,
        topTopics: topTopicResult,
        topJournals: topJournalResult,
      })
      setKeywordSeries(keywordResult)
      setTopicSeries(topicResult)
      setJournalSeries(journalResult)
    } catch (err) {
      setDashboard(EMPTY_DASHBOARD)
      setKeywordSeries([])
      setTopicSeries([])
      setJournalSeries([])
      setError(err.response?.data?.message || err.message || 'Failed to load trend data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function fetchInitialDashboard() {
      try {
        const initialFilters = getInitialFilters()
        const [
          dashboardResult,
          keywordResult,
          topKeywordResult,
          topicResult,
          topTopicResult,
          journalResult,
          topJournalResult,
        ] = await Promise.all([
          getTrendDashboard(initialFilters),
          getKeywordTrends(initialFilters),
          getTopKeywordTrends(initialFilters),
          getTopicTrends(initialFilters),
          getTopTopicTrends(initialFilters),
          getJournalTrends(initialFilters),
          getTopJournalTrends(initialFilters),
        ])
        if (active) {
          setDashboard({
            ...dashboardResult,
            topKeywords: topKeywordResult,
            topTopics: topTopicResult,
            topJournals: topJournalResult,
          })
          setKeywordSeries(keywordResult)
          setTopicSeries(topicResult)
          setJournalSeries(journalResult)
        }
      } catch (err) {
        if (active) {
          setDashboard(EMPTY_DASHBOARD)
          setKeywordSeries([])
          setTopicSeries([])
          setJournalSeries([])
          setError(err.response?.data?.message || err.message || 'Failed to load trend data.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchInitialDashboard()

    return () => {
      active = false
    }
  }, [])

  const publicationTrend = useMemo(
    () =>
      dashboard.publicationTrend
        .map((item) => ({
          ...item,
          period: formatPeriod(item),
          sortKey: getPeriodKey(item),
        }))
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
    [dashboard.publicationTrend],
  )

  const totals = useMemo(
    () => ({
      papers: publicationTrend.reduce((sum, item) => sum + (item.paperCount ?? 0), 0),
      citations: publicationTrend.reduce((sum, item) => sum + (item.citationCount ?? 0), 0),
      trendScore: publicationTrend.reduce((sum, item) => sum + (item.trendingScore ?? 0), 0),
      peakScore: Math.max(0, ...publicationTrend.map((item) => item.trendingScore ?? 0)),
      averageGrowth: publicationTrend.length
        ? publicationTrend.reduce((sum, item) => sum + (item.growthRate ?? 0), 0) /
          publicationTrend.length
        : 0,
    }),
    [publicationTrend],
  )
  const keywordChartData = useMemo(
    () => buildSeriesChartData(keywordSeries, keywordMetric, 'keyword'),
    [keywordMetric, keywordSeries],
  )
  const topicChartData = useMemo(
    () => buildSeriesChartData(topicSeries, topicMetric, 'topic'),
    [topicMetric, topicSeries],
  )
  const journalChartData = useMemo(
    () => buildSeriesChartData(journalSeries, journalMetric, 'journal'),
    [journalMetric, journalSeries],
  )
  const keywordOptions = useMemo(
    () => buildEntityOptions(dashboard.topKeywords, keywordSeries),
    [dashboard.topKeywords, keywordSeries],
  )
  const keywordColorMap = useMemo(() => buildSeriesColorMap(keywordSeries), [keywordSeries])
  const topicOptions = useMemo(
    () => buildEntityOptions(dashboard.topTopics, topicSeries),
    [dashboard.topTopics, topicSeries],
  )
  const topicColorMap = useMemo(() => buildSeriesColorMap(topicSeries), [topicSeries])
  const journalOptions = useMemo(
    () => buildEntityOptions(dashboard.topJournals, journalSeries),
    [dashboard.topJournals, journalSeries],
  )
  const journalColorMap = useMemo(() => buildSeriesColorMap(journalSeries), [journalSeries])

  const hasDashboardData =
    dashboard.topKeywords.length > 0 ||
    dashboard.topTopics.length > 0 ||
    dashboard.topJournals.length > 0 ||
    publicationTrend.length > 0 ||
    keywordSeries.length > 0 ||
    topicSeries.length > 0 ||
    journalSeries.length > 0
  const topKeyword = dashboard.topKeywords[0]
  const firstKeywordSeries = keywordSeries[0]
  const topTopic = dashboard.topTopics[0]
  const periodRange = publicationTrend.length
    ? `${publicationTrend[0].period} - ${publicationTrend[publicationTrend.length - 1].period}`
    : 'No period'
  const topKeywordName = topKeyword?.name || firstKeywordSeries?.name || 'No data'
  const topKeywordDetail = topKeyword
    ? `${formatNumber(topKeyword.paperCount)} papers`
    : firstKeywordSeries
      ? `${formatNumber(getSeriesTotal(firstKeywordSeries, 'paperCount'))} papers in series`
      : 'No keyword found'

  const handleFilterChange = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }))
  }

  const validateFilters = () => {
    if (filters.yearFrom && filters.yearTo && Number(filters.yearFrom) > Number(filters.yearTo)) {
      setError('The start year cannot be later than the end year.')
      return false
    }

    if (
      filters.monthFrom &&
      filters.monthTo &&
      (!filters.yearFrom ||
        !filters.yearTo ||
        Number(filters.yearFrom) === Number(filters.yearTo)) &&
      Number(filters.monthFrom) > Number(filters.monthTo)
    ) {
      setError('The start month cannot be later than the end month.')
      return false
    }

    return true
  }

  const handleFilter = async (event) => {
    event.preventDefault()
    if (!validateFilters()) return
    await loadTrendData(filters)
  }

  const handleReset = async () => {
    const nextFilters = getInitialFilters()
    setFilters(nextFilters)
    await loadTrendData(nextFilters)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Research intelligence</span>
          <h1 className={styles.title}>Trend Dashboard</h1>
          <p className={styles.subtitle}>
            Track publication volume, citations, and leading research entities over the selected period.
          </p>
        </div>
        <span className={styles.updatedBadge}>Live trend data</span>
      </header>

      <form className={styles.filterPanel} onSubmit={handleFilter}>
        <div className={styles.filterHeader}>
          <div>
            <h2>Filters</h2>
          </div>
          <button type="button" className={styles.resetButton} onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>

        <div className={styles.filterGrid}>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>YearFrom</span>
            <input
              type="number"
              className={styles.input}
              value={filters.yearFrom}
              onChange={handleFilterChange('yearFrom')}
              min="1900"
              max="2100"
            />
          </label>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>YearTo</span>
            <input
              type="number"
              className={styles.input}
              value={filters.yearTo}
              onChange={handleFilterChange('yearTo')}
              min="1900"
              max="2100"
            />
          </label>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>MonthFrom</span>
            <select
              className={styles.select}
              value={filters.monthFrom}
              onChange={handleFilterChange('monthFrom')}
            >
              {MONTHS.map((month) => (
                <option key={month.value || 'any-from'} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>MonthTo</span>
            <select
              className={styles.select}
              value={filters.monthTo}
              onChange={handleFilterChange('monthTo')}
            >
              {MONTHS.map((month) => (
                <option key={month.value || 'any-to'} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>Keyword</span>
            <select
              className={styles.select}
              value={filters.keywordId}
              onChange={handleFilterChange('keywordId')}
            >
              <option value="">All keywords</option>
              {keywordOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>Topic</span>
            <select
              className={styles.select}
              value={filters.topicId}
              onChange={handleFilterChange('topicId')}
            >
              <option value="">All topics</option>
              {topicOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>Journal</span>
            <select
              className={styles.select}
              value={filters.journalId}
              onChange={handleFilterChange('journalId')}
            >
              <option value="">All journals</option>
              {journalOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>Top</span>
            <input
              type="number"
              className={styles.input}
              value={filters.top}
              onChange={handleFilterChange('top')}
              min="1"
              max="50"
            />
          </label>
        </div>

        <div className={styles.filterActions}>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Loading...' : 'Apply filters'}
          </button>
        </div>
      </form>

      {loading && !hasDashboardData ? (
        <>
          <div className={styles.statsGrid}>
            <Skeleton variant="card" count={5} />
          </div>
          <div className={styles.loadingBlock}>
            <Skeleton variant="chart" />
          </div>
        </>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span>Publications</span>
              <strong>{formatNumber(totals.papers)}</strong>
              <small>{periodRange}</small>
            </article>
            <article className={styles.statCard}>
              <span>Citations</span>
              <strong>{formatNumber(totals.citations)}</strong>
              <small>Across publication trend</small>
            </article>
            <article className={styles.statCard}>
              <span>Top keyword</span>
              <strong className={styles.statTitleValue}>{topKeywordName}</strong>
              <small>{topKeywordDetail}</small>
            </article>
            <article className={styles.statCard}>
              <span>Trend score</span>
              <strong>{totals.trendScore.toFixed(2)}</strong>
              <small>Combined period score</small>
            </article>
            <article className={styles.statCard}>
              <span>Peak score</span>
              <strong>{totals.peakScore.toFixed(2)}</strong>
              <small className={getGrowthClass(totals.averageGrowth)}>
                {formatGrowth(totals.averageGrowth)} average growth
              </small>
            </article>
          </div>

          <article className={`${styles.panel} ${styles.widePanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Timeline</span>
                <h2 className={styles.panelTitle}>Publication and citation trend</h2>
              </div>
              <span className={styles.panelMeta}>{periodRange}</span>
            </div>
            <div className={styles.chartWrap}>
              {publicationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={publicationTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis
                      yAxisId="papers"
                      allowDecimals={false}
                      stroke="#1e40af"
                      tick={{ fill: '#475569', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="citations"
                      orientation="right"
                      allowDecimals={false}
                      stroke="#0891b2"
                      tick={{ fill: '#475569', fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => formatNumber(value)}
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      yAxisId="papers"
                      type="monotone"
                      dataKey="paperCount"
                      name="Papers"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="citations"
                      type="monotone"
                      dataKey="citationCount"
                      name="Citations"
                      stroke="#0891b2"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.emptyText}>No publication trend data for these filters.</p>
              )}
            </div>
          </article>

          <div className={styles.topicSplit}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Keywords</span>
                  <h2 className={styles.panelTitle}>Top keywords</h2>
                </div>
              </div>
              <EntityList
                items={dashboard.topKeywords}
                type="keyword"
                featuredName={topKeyword?.name}
                colorMap={keywordColorMap}
              />
            </article>

            <article className={`${styles.panel} ${styles.widePanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Keywords</span>
                  <h2 className={styles.panelTitle}>Keyword momentum over time</h2>
                </div>
                <div className={styles.metricSwitch}>
                  <button
                    type="button"
                    className={keywordMetric === 'paperCount' ? styles.metricActive : ''}
                    onClick={() => setKeywordMetric('paperCount')}
                  >
                    Papers
                  </button>
                  <button
                    type="button"
                    className={keywordMetric === 'citationCount' ? styles.metricActive : ''}
                    onClick={() => setKeywordMetric('citationCount')}
                  >
                    Citations
                  </button>
                  <button
                    type="button"
                    className={keywordMetric === 'trendingScore' ? styles.metricActive : ''}
                    onClick={() => setKeywordMetric('trendingScore')}
                  >
                    Score
                  </button>
                </div>
              </div>
              <div className={styles.chartWrap}>
                {keywordChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={keywordChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                      <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) =>
                          keywordMetric === 'trendingScore'
                            ? Number(value ?? 0).toFixed(2)
                            : formatNumber(value)
                        }
                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }}
                      />
                      {keywordSeries.map((series, index) => (
                        <Line
                          key={series.id}
                          type="monotone"
                          dataKey={`keyword_${series.id}`}
                          name={series.name}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2.5}
                          connectNulls
                          dot={{ r: 2.5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className={styles.emptyText}>No keyword trend data for these filters.</p>
                )}
              </div>
            </article>
          </div>

          <div className={styles.topicSplit}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Topics</span>
                  <h2 className={styles.panelTitle}>Top topics</h2>
                </div>
              </div>
              <EntityList
                items={dashboard.topTopics}
                type="topic"
                featuredName={topTopic?.name}
                colorMap={topicColorMap}
              />
            </article>

            <article className={`${styles.panel} ${styles.widePanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Topics</span>
                  <h2 className={styles.panelTitle}>Topic momentum over time</h2>
                </div>
                <div className={styles.metricSwitch}>
                  <button
                    type="button"
                    className={topicMetric === 'paperCount' ? styles.metricActive : ''}
                    onClick={() => setTopicMetric('paperCount')}
                  >
                    Papers
                  </button>
                  <button
                    type="button"
                    className={topicMetric === 'citationCount' ? styles.metricActive : ''}
                    onClick={() => setTopicMetric('citationCount')}
                  >
                    Citations
                  </button>
                  <button
                    type="button"
                    className={topicMetric === 'trendingScore' ? styles.metricActive : ''}
                    onClick={() => setTopicMetric('trendingScore')}
                  >
                    Score
                  </button>
                </div>
              </div>
              <div className={styles.chartWrap}>
                {topicChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topicChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                      <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) =>
                          topicMetric === 'trendingScore'
                            ? Number(value ?? 0).toFixed(2)
                            : formatNumber(value)
                        }
                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }}
                      />
                      {topicSeries.map((series, index) => (
                        <Line
                          key={series.id}
                          type="monotone"
                          dataKey={`topic_${series.id}`}
                          name={series.name}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2.5}
                          connectNulls
                          dot={{ r: 2.5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className={styles.emptyText}>No topic trend data for these filters.</p>
                )}
              </div>
            </article>
          </div>

          <article className={`${styles.panel} ${styles.widePanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Journals</span>
                <h2 className={styles.panelTitle}>Journal momentum over time</h2>
              </div>
              <div className={styles.metricSwitch}>
                <button
                  type="button"
                  className={journalMetric === 'paperCount' ? styles.metricActive : ''}
                  onClick={() => setJournalMetric('paperCount')}
                >
                  Papers
                </button>
                <button
                  type="button"
                  className={journalMetric === 'citationCount' ? styles.metricActive : ''}
                  onClick={() => setJournalMetric('citationCount')}
                >
                  Citations
                </button>
                <button
                  type="button"
                  className={journalMetric === 'trendingScore' ? styles.metricActive : ''}
                  onClick={() => setJournalMetric('trendingScore')}
                >
                  Score
                </button>
              </div>
            </div>
            <div className={styles.chartWrap}>
              {journalChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={journalChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis allowDecimals={false} stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) =>
                        journalMetric === 'trendingScore'
                          ? Number(value ?? 0).toFixed(2)
                          : formatNumber(value)
                      }
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }}
                    />
                    {journalSeries.map((series, index) => (
                      <Line
                        key={series.id}
                        type="monotone"
                        dataKey={`journal_${series.id}`}
                        name={series.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2.5}
                        connectNulls
                        dot={{ r: 2.5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.emptyText}>No journal trend data for these filters.</p>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Journals</span>
                <h2 className={styles.panelTitle}>Top journals</h2>
              </div>
            </div>
            {dashboard.topJournals.length > 0 ? (
              <div className={styles.journalGrid}>
                {dashboard.topJournals.map((item, index) => {
                  const itemColor =
                    journalColorMap.get(`id:${item.id}`) ?? journalColorMap.get(`name:${item.name}`)

                  return (
                    <Link
                      key={item.id}
                      to={getEntityLink('journal', item)}
                      className={styles.journalCard}
                    >
                      <span className={styles.journalRank}>#{index + 1}</span>
                      <span className={styles.journalTitle}>
                        {itemColor && (
                          <span
                            className={styles.entityColorDot}
                            style={{ backgroundColor: itemColor }}
                            aria-hidden="true"
                          />
                        )}
                        <strong>{item.name}</strong>
                      </span>
                      <div>
                        <span>{formatNumber(item.paperCount)} papers</span>
                        <span>{formatNumber(item.citationCount)} citations</span>
                      </div>
                      <small className={getGrowthClass(item.growthRate)}>
                        {formatGrowth(item.growthRate)} growth / score {Number(item.trendingScore ?? 0).toFixed(2)}
                      </small>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>No journal data available.</p>
            )}
          </article>
        </>
      )}

      <PublicationReportPage embedded />
    </section>
  )
}

function EntityList({ items, type, featuredName, colorMap }) {
  if (!items.length) {
    return <p className={styles.emptyList}>No {type} data available.</p>
  }

  return (
    <div className={styles.entityList}>
      {items.map((item, index) => {
        const itemColor = colorMap?.get(`id:${item.id}`) ?? colorMap?.get(`name:${item.name}`)

        return (
          <Link
            key={item.id}
            to={getEntityLink(type, item)}
            className={`${styles.entityItem} ${featuredName === item.name ? styles.entityItemFeatured : ''}`}
          >
            <span className={styles.entityRank}>{index + 1}</span>
            <span className={styles.entityBody}>
              <span className={styles.entityTitle}>
                {itemColor && (
                  <span
                    className={styles.entityColorDot}
                    style={{ backgroundColor: itemColor }}
                    aria-hidden="true"
                  />
                )}
                <strong>{item.name}</strong>
              </span>
              <small>{formatPeriod(item)}</small>
            </span>
            <span className={styles.entityMetrics}>
              <span>{formatNumber(item.paperCount)} papers</span>
              <span>{formatNumber(item.citationCount)} citations</span>
              <span className={getGrowthClass(item.growthRate)}>{formatGrowth(item.growthRate)}</span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default TrendChartPage
