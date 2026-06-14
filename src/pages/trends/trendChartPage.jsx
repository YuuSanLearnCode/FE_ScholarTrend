import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  compareTrends,
  getJournalTrends,
  getKeywordTrends,
  getPublicationTrends,
  getTopJournalTrends,
  getTopKeywordTrends,
  getTopTopicTrends,
  getTopicTrends,
  getTrendDashboard,
} from '../../services/trendService'
import { getJournals } from '../../services/journalService'
import { getTopics } from '../../services/topicService'
import Skeleton from '../../components/Skeleton'
import styles from './trendChartPage.module.css'

const COLORS = ['#1e40af', '#0891b2', '#16a34a', '#d97706', '#7c3aed', '#db2777']
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

function formatPeriod(item) {
  if (!item.month) return String(item.year)
  return `${String(item.month).padStart(2, '0')}/${item.year}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function getGrowthClass(growthRate) {
  if (growthRate > 0) return styles.positive
  if (growthRate < 0) return styles.negative
  return styles.neutral
}

function formatGrowth(growthRate) {
  const value = Number(growthRate) || 0
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function buildSeriesChartData(series, metric, keyPrefix) {
  const periods = new Map()

  series.forEach((item) => {
    item.dataPoints.forEach((point) => {
      const key = `${point.year}-${String(point.month || 0).padStart(2, '0')}`
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

function getCompareLink(type, series) {
  if (type === 'keyword') {
    return `/search/results?keyword=${encodeURIComponent(series.name)}&searchType=Keyword&page=1&pageSize=10`
  }
  if (type === 'topic') {
    return `/topics/${series.id}`
  }
  return `/journals/${series.id}`
}

function TrendChartPage() {
  const [chartType, setChartType] = useState('line')
  const [keywordMetric, setKeywordMetric] = useState('paperCount')
  const [topicMetric, setTopicMetric] = useState('paperCount')
  const [journalMetric, setJournalMetric] = useState('paperCount')
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD)
  const [keywordSeries, setKeywordSeries] = useState([])
  const [topicSeries, setTopicSeries] = useState([])
  const [journalSeries, setJournalSeries] = useState([])
  const [compareType, setCompareType] = useState('keyword')
  const [compareIds, setCompareIds] = useState([])
  const [compareMetric, setCompareMetric] = useState('paperCount')
  const [compareSeries, setCompareSeries] = useState([])
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState('')
  const [options, setOptions] = useState({
    keywords: [],
    topics: [],
    journals: [],
  })
  const [filters, setFilters] = useState(getInitialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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
          publicationResult,
          allTopicsResult,
          allJournalsResult,
        ] = await Promise.all([
          getTrendDashboard(initialFilters),
          getKeywordTrends(initialFilters),
          getTopKeywordTrends(initialFilters),
          getTopicTrends(initialFilters),
          getTopTopicTrends(initialFilters),
          getJournalTrends(initialFilters),
          getTopJournalTrends(initialFilters),
          getPublicationTrends(initialFilters),
          getTopics(),
          getJournals(),
        ])
        setDashboard({
          ...dashboardResult,
          topKeywords: topKeywordResult,
          topTopics: topTopicResult,
          topJournals: topJournalResult,
          publicationTrend: publicationResult,
        })
        setKeywordSeries(keywordResult)
        setTopicSeries(topicResult)
        setJournalSeries(journalResult)
        setOptions({
          keywords: topKeywordResult,
          topics: allTopicsResult,
          journals: allJournalsResult,
        })
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load trend data')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialDashboard()
  }, [])

  const handleFilterChange = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleCompareTypeChange = (event) => {
    setCompareType(event.target.value)
    setCompareIds([])
    setCompareSeries([])
    setCompareError('')
  }

  const handleCompareIdChange = (id) => {
    setCompareError('')
    if (!compareIds.includes(id) && compareIds.length >= COLORS.length) {
      setCompareError(`You can compare up to ${COLORS.length} items at once.`)
      return
    }

    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }
      return [...current, id]
    })
  }

  const handleCompare = async (event) => {
    event.preventDefault()
    if (compareIds.length < 2) {
      setCompareError('Select at least two items to compare.')
      return
    }

    setCompareLoading(true)
    setCompareError('')
    try {
      setCompareSeries(await compareTrends(compareType, compareIds, filters))
    } catch (err) {
      setCompareError(err.response?.data?.message || err.message || 'Failed to compare trends')
    } finally {
      setCompareLoading(false)
    }
  }

  const loadDashboard = async (nextFilters) => {
    setLoading(true)
    setError('')
    setCompareSeries([])
    try {
      const [
        dashboardResult,
        keywordResult,
        topKeywordResult,
        topicResult,
        topTopicResult,
        journalResult,
        topJournalResult,
        publicationResult,
      ] = await Promise.all([
        getTrendDashboard(nextFilters),
        getKeywordTrends(nextFilters),
        getTopKeywordTrends(nextFilters),
        getTopicTrends(nextFilters),
        getTopTopicTrends(nextFilters),
        getJournalTrends(nextFilters),
        getTopJournalTrends(nextFilters),
        getPublicationTrends(nextFilters),
      ])
      setDashboard({
        ...dashboardResult,
        topKeywords: topKeywordResult,
        topTopics: topTopicResult,
        topJournals: topJournalResult,
        publicationTrend: publicationResult,
      })
      setKeywordSeries(keywordResult)
      setTopicSeries(topicResult)
      setJournalSeries(journalResult)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to filter trend data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = async (event) => {
    event.preventDefault()

    if (filters.yearFrom && filters.yearTo && Number(filters.yearFrom) > Number(filters.yearTo)) {
      setError('The start year cannot be later than the end year.')
      return
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
      return
    }

    await loadDashboard(filters)
  }

  const handleReset = async () => {
    const initialFilters = getInitialFilters()
    setFilters(initialFilters)
    await loadDashboard(initialFilters)
  }

  const publicationTrend = dashboard.publicationTrend.map((item) => ({
    ...item,
    period: formatPeriod(item),
  }))
  const totalPapers = publicationTrend.reduce((sum, item) => sum + (item.paperCount ?? 0), 0)
  const totalCitations = publicationTrend.reduce(
    (sum, item) => sum + (item.citationCount ?? 0),
    0,
  )
  const averageGrowth = publicationTrend.length
    ? publicationTrend.reduce((sum, item) => sum + (item.growthRate ?? 0), 0) /
      publicationTrend.length
    : 0
  const keywordChartData = buildSeriesChartData(keywordSeries, keywordMetric, 'keyword')
  const topicChartData = buildSeriesChartData(topicSeries, topicMetric, 'topic')
  const journalChartData = buildSeriesChartData(journalSeries, journalMetric, 'journal')
  const compareChartData = buildSeriesChartData(compareSeries, compareMetric, 'compare')
  const compareOptions =
    compareType === 'keyword'
      ? options.keywords
      : compareType === 'topic'
        ? options.topics
        : options.journals

  if (loading && !publicationTrend.length) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="40%" />
        <div className={styles.loadingBlock}><Skeleton variant="chart" /></div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Research intelligence</span>
          <h1 className={styles.title}>Trend Dashboard</h1>
          <p className={styles.subtitle}>
            Explore publication volume, citations, and the research areas gaining momentum.
          </p>
        </div>
        <span className={styles.updatedBadge}>Live API data</span>
      </header>

      <form className={styles.filterPanel} onSubmit={handleFilter}>
        <div className={styles.filterHeader}>
          <div>
            <h2>Filter trends</h2>
            <p>Narrow the dashboard by time period or research entity.</p>
          </div>
          <button type="button" className={styles.resetButton} onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-year-from">Year from</label>
            <input
              id="trend-year-from"
              type="number"
              className={styles.input}
              value={filters.yearFrom}
              onChange={handleFilterChange('yearFrom')}
              min="1900"
              max="2100"
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-year-to">Year to</label>
            <input
              id="trend-year-to"
              type="number"
              className={styles.input}
              value={filters.yearTo}
              onChange={handleFilterChange('yearTo')}
              min="1900"
              max="2100"
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-month-from">Month from</label>
            <select
              id="trend-month-from"
              className={styles.select}
              value={filters.monthFrom}
              onChange={handleFilterChange('monthFrom')}
            >
              <option value="">Any month</option>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>{index + 1}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-month-to">Month to</label>
            <select
              id="trend-month-to"
              className={styles.select}
              value={filters.monthTo}
              onChange={handleFilterChange('monthTo')}
            >
              <option value="">Any month</option>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>{index + 1}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-keyword">Keyword</label>
            <select
              id="trend-keyword"
              className={styles.select}
              value={filters.keywordId}
              onChange={handleFilterChange('keywordId')}
            >
              <option value="">All keywords</option>
              {options.keywords.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-topic">Topic</label>
            <select
              id="trend-topic"
              className={styles.select}
              value={filters.topicId}
              onChange={handleFilterChange('topicId')}
            >
              <option value="">All topics</option>
              {options.topics.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-journal">Journal</label>
            <select
              id="trend-journal"
              className={styles.select}
              value={filters.journalId}
              onChange={handleFilterChange('journalId')}
            >
              <option value="">All journals</option>
              {options.journals.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="trend-top">Top results</label>
            <select
              id="trend-top"
              className={styles.select}
              value={filters.top}
              onChange={handleFilterChange('top')}
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Applying...' : 'Apply filters'}
          </button>
        </div>
      </form>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span>Publications</span>
          <strong>{formatNumber(totalPapers)}</strong>
          <small>Within selected period</small>
        </article>
        <article className={styles.statCard}>
          <span>Citations</span>
          <strong>{formatNumber(totalCitations)}</strong>
          <small>Research impact</small>
        </article>
        <article className={styles.statCard}>
          <span>Average growth</span>
          <strong className={getGrowthClass(averageGrowth)}>
            {averageGrowth > 0 ? '+' : ''}{averageGrowth.toFixed(1)}%
          </strong>
          <small>Across trend points</small>
        </article>
        <article className={styles.statCard}>
          <span>Trending score</span>
          <strong>
            {Math.max(0, ...publicationTrend.map((item) => item.trendingScore ?? 0)).toFixed(2)}
          </strong>
          <small>Peak score</small>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Side-by-side analysis</span>
            <h2 className={styles.panelTitle}>Compare research trends</h2>
          </div>
          <div className={styles.metricSwitch}>
            <button
              type="button"
              className={compareMetric === 'paperCount' ? styles.metricActive : ''}
              onClick={() => setCompareMetric('paperCount')}
            >
              Papers
            </button>
            <button
              type="button"
              className={compareMetric === 'citationCount' ? styles.metricActive : ''}
              onClick={() => setCompareMetric('citationCount')}
            >
              Citations
            </button>
          </div>
        </div>

        <form className={styles.compareForm} onSubmit={handleCompare}>
          <div className={styles.compareType}>
            <label className={styles.filterLabel} htmlFor="compare-type">Compare by</label>
            <select
              id="compare-type"
              className={styles.select}
              value={compareType}
              onChange={handleCompareTypeChange}
            >
              <option value="keyword">Keywords</option>
              <option value="topic">Topics</option>
              <option value="journal">Journals</option>
            </select>
          </div>

          <div className={styles.comparePicker}>
            <span className={styles.filterLabel}>
              Select 2-{COLORS.length} items
            </span>
            <div className={styles.compareChoices}>
              {compareOptions.map((item) => {
                const isSelected = compareIds.includes(item.id)
                return (
                  <label
                    key={item.id}
                    className={`${styles.compareChoice} ${isSelected ? styles.compareChoiceActive : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCompareIdChange(item.id)}
                    />
                    <span>{item.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className={styles.compareSubmit}>
            <span>{compareIds.length} selected</span>
            <button type="submit" className={styles.button} disabled={compareLoading}>
              {compareLoading ? 'Comparing...' : 'Compare'}
            </button>
          </div>
        </form>

        {compareError && <p className={styles.compareError}>{compareError}</p>}

        <div className={styles.chartWrap}>
          {compareLoading ? (
            <Skeleton variant="chart" />
          ) : compareChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compareChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                {compareSeries.map((series, index) => (
                  <Line
                    key={series.id}
                    type="monotone"
                    dataKey={`compare_${series.id}`}
                    name={series.name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    connectNulls
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.emptyText}>
              Select research entities above to compare their performance over time.
            </p>
          )}
        </div>

        {compareSeries.length > 0 && (
          <div className={styles.seriesLegend}>
            {compareSeries.map((series, index) => (
              <Link
                key={series.id}
                to={getCompareLink(compareType, series)}
                className={styles.seriesLegendItem}
              >
                <span style={{ background: COLORS[index % COLORS.length] }} />
                {series.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Timeline</span>
            <h2 className={styles.panelTitle}>Publication & citation trend</h2>
          </div>
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => setChartType((current) => (current === 'line' ? 'bar' : 'line'))}
          >
            Show {chartType === 'line' ? 'bars' : 'lines'}
          </button>
        </div>
        <div className={styles.chartWrap}>
          {loading ? (
            <Skeleton variant="chart" />
          ) : publicationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={publicationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                  <Line type="monotone" dataKey="paperCount" name="Papers" stroke="#1e40af" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="citationCount" name="Citations" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              ) : (
                <BarChart data={publicationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                  <Bar dataKey="paperCount" name="Papers" fill="#1e40af" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="citationCount" name="Citations" fill="#0891b2" radius={[5, 5, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p className={styles.emptyText}>No publication trend data for these filters.</p>
          )}
        </div>
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Keyword series</span>
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
          </div>
        </div>
        <div className={styles.chartWrap}>
          {loading ? (
            <Skeleton variant="chart" />
          ) : keywordChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={keywordChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
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
            <p className={styles.emptyText}>No keyword series data for these filters.</p>
          )}
        </div>
        {keywordSeries.length > 0 && (
          <div className={styles.seriesLegend}>
            {keywordSeries.map((series, index) => (
              <Link
                key={series.id}
                to={`/search/results?keyword=${encodeURIComponent(series.name)}&searchType=Keyword&page=1&pageSize=10`}
                className={styles.seriesLegendItem}
              >
                <span style={{ background: COLORS[index % COLORS.length] }} />
                {series.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Topic series</span>
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
          </div>
        </div>
        <div className={styles.chartWrap}>
          {loading ? (
            <Skeleton variant="chart" />
          ) : topicChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={topicChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
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
            <p className={styles.emptyText}>No topic series data for these filters.</p>
          )}
        </div>
        {topicSeries.length > 0 && (
          <div className={styles.seriesLegend}>
            {topicSeries.map((series, index) => (
              <Link
                key={series.id}
                to={`/topics/${series.id}`}
                className={styles.seriesLegendItem}
              >
                <span style={{ background: COLORS[index % COLORS.length] }} />
                {series.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Journal series</span>
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
          </div>
        </div>
        <div className={styles.chartWrap}>
          {loading ? (
            <Skeleton variant="chart" />
          ) : journalChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={journalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
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
            <p className={styles.emptyText}>No journal series data for these filters.</p>
          )}
        </div>
        {journalSeries.length > 0 && (
          <div className={styles.seriesLegend}>
            {journalSeries.map((series, index) => (
              <Link
                key={series.id}
                to={`/journals/${series.id}`}
                className={styles.seriesLegendItem}
              >
                <span style={{ background: COLORS[index % COLORS.length] }} />
                {series.name}
              </Link>
            ))}
          </div>
        )}
      </article>

      <div className={styles.chartsRow}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Discovery</span>
              <h2 className={styles.panelTitle}>Top keywords</h2>
            </div>
          </div>
          <div className={styles.chartWrapSmall}>
            {dashboard.topKeywords.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.topKeywords} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={105} tick={{ fill: '#475569', fontSize: 10 }} />
                  <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                  <Bar dataKey="paperCount" name="Papers" fill="#3b82f6" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyText}>No keyword data available.</p>
            )}
          </div>
          <div className={styles.rankList}>
            {dashboard.topKeywords.slice(0, 5).map((item, index) => (
              <Link
                key={item.id}
                to={`/search/results?keyword=${encodeURIComponent(item.name)}&searchType=Keyword&page=1&pageSize=10`}
                className={styles.rankItem}
              >
                <span className={styles.rankNumber}>{index + 1}</span>
                <span className={styles.rankName}>{item.name}</span>
                <span className={getGrowthClass(item.growthRate)}>
                  {formatGrowth(item.growthRate)}
                </span>
              </Link>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Research areas</span>
              <h2 className={styles.panelTitle}>Top topics</h2>
            </div>
          </div>
          <div className={styles.chartWrapSmall}>
            {dashboard.topTopics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.topTopics}
                    dataKey="paperCount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {dashboard.topTopics.map((item, index) => (
                      <Cell key={item.id} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyText}>No topic data available.</p>
            )}
          </div>
          <div className={styles.rankList}>
            {dashboard.topTopics.slice(0, 5).map((item, index) => (
              <Link
                key={item.id}
                to={`/topics/${item.id}`}
                className={styles.rankItem}
              >
                <span
                  className={styles.rankDot}
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <span className={styles.rankName}>{item.name}</span>
                <span>{formatNumber(item.paperCount)} papers</span>
              </Link>
            ))}
          </div>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Publication venues</span>
            <h2 className={styles.panelTitle}>Top journals</h2>
          </div>
        </div>
        <div className={styles.journalGrid}>
          {dashboard.topJournals.length > 0 ? (
            dashboard.topJournals.map((item, index) => (
              <Link
                key={item.id}
                to={`/journals/${item.id}`}
                className={styles.journalCard}
              >
                <span className={styles.journalRank}>#{index + 1}</span>
                <strong>{item.name}</strong>
                <div>
                  <span>{formatNumber(item.paperCount)} papers</span>
                  <span>{formatNumber(item.citationCount)} citations</span>
                </div>
                <small className={getGrowthClass(item.growthRate)}>
                  {formatGrowth(item.growthRate)} growth
                </small>
              </Link>
            ))
          ) : (
            <p className={styles.emptyText}>No journal data available.</p>
          )}
        </div>
      </article>
    </section>
  )
}

export default TrendChartPage
