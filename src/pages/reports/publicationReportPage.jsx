import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Skeleton from '../../components/Skeleton'
import {
  buildReportCsv,
  buildReportJson,
  downloadTextFile,
  getPublicationReport,
} from '../../services/reportService'
import styles from './publicationReportPage.module.css'

const FILTERS_KEY = 'publicationReportFilters'
const SNAPSHOT_KEY = 'publicationReportSnapshot'
const GROUP_BY_OPTIONS = [
  { value: 'keyword', label: 'Keyword' },
  { value: 'topic', label: 'Topic' },
  { value: 'journal', label: 'Journal' },
]

function normalizeUiGroupBy(groupBy) {
  const value = String(groupBy || 'keyword').trim().toLowerCase()
  if (['keyword', 'topic', 'journal'].includes(value)) return value
  return 'keyword'
}

function getDefaultFilters() {
  const currentYear = new Date().getFullYear()
  return {
    yearFrom: String(currentYear - 5),
    yearTo: String(currentYear),
    groupBy: 'keyword',
    top: '10',
  }
}

function getInitialFilters() {
  const saved = sessionStorage.getItem(FILTERS_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return {
        ...getDefaultFilters(),
        ...parsed,
        groupBy: normalizeUiGroupBy(parsed.groupBy),
      }
    } catch {
      // Ignore invalid JSON
    }
  }
  return getDefaultFilters()
}

function getSavedSnapshot() {
  const saved = sessionStorage.getItem(SNAPSHOT_KEY)
  if (!saved) return null
  try {
    const parsed = JSON.parse(saved)
    if (!parsed?.report || !Array.isArray(parsed.report.items)) return null
    const groupBy = normalizeUiGroupBy(parsed.report.groupBy || parsed.filters?.groupBy)
    if (!['keyword', 'topic', 'journal'].includes(String(parsed.report.groupBy || '').toLowerCase())) {
      sessionStorage.removeItem(SNAPSHOT_KEY)
      return null
    }
    return {
      ...parsed,
      filters: parsed.filters
        ? { ...parsed.filters, groupBy }
        : undefined,
      report: { ...parsed.report, groupBy },
    }
  } catch {
    return null
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function formatDate(value) {
  const dateStr = value
    ? typeof value === 'string' &&
      !value.endsWith('Z') &&
      !value.match(/[+-]\d{2}:?\d{2}$/)
      ? `${value}Z`
      : value
    : null
  const date = dateStr ? new Date(dateStr) : null
  if (!date || Number.isNaN(date.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatGrowth(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

function PublicationReportPage({ embedded = false }) {
  const savedSnapshot = getSavedSnapshot()
  const [filters, setFilters] = useState(getInitialFilters)
  const [appliedFilters, setAppliedFilters] = useState(savedSnapshot?.filters ?? null)
  const [report, setReport] = useState(savedSnapshot?.report ?? null)
  const [loading, setLoading] = useState(!savedSnapshot?.report)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState(null)

  const handleError = (err, defaultMsg) => {
    const status = err.response?.status
    setErrorCode(status || 500)
    if (status === 403) {
      setError('Access Denied. You do not have permission to access publication reports.')
    } else if (status === 401) {
      setError('Please sign in to access reports.')
    } else {
      setError(err.response?.data?.message || err.message || defaultMsg)
    }
  }

  const persistSnapshot = (nextFilters, nextReport) => {
    sessionStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({
        filters: nextFilters,
        report: nextReport,
        savedAt: new Date().toISOString(),
      }),
    )
  }

  const loadReport = async (nextFilters) => {
    setLoading(true)
    setError('')
    setErrorCode(null)
    try {
      const nextReport = await getPublicationReport(nextFilters)
      setReport(nextReport)
      setAppliedFilters(nextFilters)
      persistSnapshot(nextFilters, nextReport)
    } catch (err) {
      handleError(err, 'Failed to load report.')
      setReport(null)
      setAppliedFilters(null)
      sessionStorage.removeItem(SNAPSHOT_KEY)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (savedSnapshot?.report) return undefined

    let active = true

    async function fetchInitialReport() {
      try {
        const initialFilters = getInitialFilters()
        const result = await getPublicationReport(initialFilters)
        if (!active) return
        setReport(result)
        setAppliedFilters(initialFilters)
        persistSnapshot(initialFilters, result)
      } catch (err) {
        if (active) handleError(err, 'Failed to load report.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchInitialReport()
    return () => {
      active = false
    }
    // Only run once on mount when no saved snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
  }, [filters])

  const handleChange = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (filters.yearFrom && filters.yearTo && Number(filters.yearFrom) > Number(filters.yearTo)) {
      setError('The start year cannot be later than the end year.')
      setErrorCode(null)
      return
    }
    const top = Number(filters.top)
    if (filters.top !== '' && (!Number.isFinite(top) || top < 1 || top > 50)) {
      setError('Top must be between 1 and 50 (or leave empty for all).')
      setErrorCode(null)
      return
    }
    await loadReport(filters)
  }

  const handleExportCsv = () => {
    if (!report) {
      setError('Generate a report first, then export that result.')
      setErrorCode(null)
      return
    }
    try {
      setExporting(true)
      setError('')
      const stamp = new Date().toISOString().slice(0, 10)
      downloadTextFile(
        buildReportCsv(report),
        `publication-report-${report.groupBy || 'keyword'}-${stamp}.csv`,
        'text/csv;charset=utf-8',
      )
    } catch (err) {
      handleError(err, 'Failed to export CSV report.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportJson = () => {
    if (!report) {
      setError('Generate a report first, then export that result.')
      setErrorCode(null)
      return
    }
    try {
      setExporting(true)
      setError('')
      const stamp = new Date().toISOString().slice(0, 10)
      downloadTextFile(
        buildReportJson(report),
        `publication-report-${report.groupBy || 'keyword'}-${stamp}.json`,
        'application/json;charset=utf-8',
      )
    } catch (err) {
      handleError(err, 'Failed to export JSON report.')
    } finally {
      setExporting(false)
    }
  }

  const totalCitations = report?.totalCitations
    ?? report?.items.reduce((sum, item) => sum + (item.totalCitations ?? 0), 0)
    ?? 0
  const averageCitations = report?.totalPapers ? totalCitations / report.totalPapers : 0
  const showEntityColumns = Boolean(report)
  const filtersDirty =
    appliedFilters &&
    (String(filters.yearFrom) !== String(appliedFilters.yearFrom) ||
      String(filters.yearTo) !== String(appliedFilters.yearTo) ||
      String(filters.groupBy).toLowerCase() !== String(appliedFilters.groupBy).toLowerCase() ||
      String(filters.top ?? '') !== String(appliedFilters.top ?? ''))

  return (
    <section className={`${styles.page} ${embedded ? styles.embeddedPage : ''}`} id="publication-report">
      <header className={`${styles.header} ${embedded ? styles.embeddedHeader : ''}`}>
        <div>
          <span className={styles.eyebrow}>Research reporting</span>
          {embedded ? <h2>Publication Report</h2> : <h1>Publication Report</h1>}
          <p>
            Choose year range, group by keyword/topic/journal, generate once, then export that
            same result.
          </p>
        </div>
        {report?.generatedAt && (
          <span className={styles.generated}>Generated {formatDate(report.generatedAt)}</span>
        )}
      </header>

      <form className={styles.filterPanel} onSubmit={handleSubmit}>
        <label>
          <span>Year from</span>
          <input
            type="number"
            min="1900"
            max="2100"
            value={filters.yearFrom}
            onChange={handleChange('yearFrom')}
          />
        </label>
        <label>
          <span>Year to</span>
          <input
            type="number"
            min="1900"
            max="2100"
            value={filters.yearTo}
            onChange={handleChange('yearTo')}
          />
        </label>
        <label>
          <span>Group by</span>
          <select value={filters.groupBy} onChange={handleChange('groupBy')} required>
            {GROUP_BY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Top (optional)</span>
          <input
            type="number"
            min="1"
            max="50"
            placeholder="All"
            value={filters.top}
            onChange={handleChange('top')}
          />
        </label>
        <div className={styles.buttonGroup}>
          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate report'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || exporting || !report}
            className={styles.exportBtn}
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            disabled={loading || exporting || !report}
            className={styles.exportBtn}
          >
            Export JSON
          </button>
        </div>
      </form>

      {filtersDirty && report && (
        <p className={styles.snapshotNote}>
          Filters changed since last generate. Export still uses the generated snapshot above — click
          Generate report to refresh.
        </p>
      )}

      {error && errorCode !== 403 && errorCode !== 401 && (
        <p className={styles.error}>{error}</p>
      )}

      {errorCode === 403 && (
        <div className={styles.upgradeBox}>
          <div className={styles.upgradeIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className={styles.upgradeContent}>
            <h3>Premium Feature</h3>
            <p>
              Publication reports are only available for Researcher subscriptions and Admins. Upgrade
              your plan to unlock deep research analytics, exporting, and more.
            </p>
          </div>
          <Link to="/pricing" className={styles.upgradeBtn}>
            View Subscription Plans
          </Link>
        </div>
      )}

      {errorCode === 401 && (
        <div className={styles.upgradeBox}>
          <div className={styles.upgradeIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div className={styles.upgradeContent}>
            <h3>Sign in required</h3>
            <p>You need to be logged in to access advanced reporting features.</p>
          </div>
          <Link to="/login" className={styles.upgradeBtn}>
            Sign In
          </Link>
        </div>
      )}

      {loading && !report ? (
        <>
          <div className={styles.statsGrid}>
            <Skeleton variant="card" count={4} />
          </div>
          <Skeleton variant="chart" />
        </>
      ) : report ? (
        <>
          <div className={styles.statsGrid}>
            <article>
              <span>Total papers</span>
              <strong>{formatNumber(report.totalPapers)}</strong>
            </article>
            <article>
              <span>Total citations</span>
              <strong>{formatNumber(totalCitations)}</strong>
            </article>
            <article>
              <span>Citations per paper</span>
              <strong>{averageCitations.toFixed(1)}</strong>
            </article>
            <article>
              <span>Avg reliability</span>
              <strong>
                {report.averageReliability != null
                  ? `${Number(report.averageReliability).toFixed(1)}%`
                  : '—'}
              </strong>
            </article>
          </div>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Grouped by {report.groupBy || 'keyword'}
                  {report.top ? ` · Top ${report.top}` : ''}
                </span>
                <h2>Publications and citations</h2>
              </div>
              <span>
                {report.yearFrom || appliedFilters?.yearFrom} - {report.yearTo || appliedFilters?.yearTo}
              </span>
            </div>
            <div className={styles.chart}>
              {report.items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.items}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="key" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                    <Bar dataKey="paperCount" name="Papers" fill="#1e40af" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="totalCitations" name="Citations" fill="#0891b2" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.empty}>No report data is available for these filters.</p>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Citation impact</span>
                <h2>Citation trend</h2>
              </div>
            </div>
            <div className={styles.chartSmall}>
              {report.items.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.items}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="key" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="totalCitations"
                      name="Citations"
                      stroke="#0891b2"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.empty}>No citation data is available.</p>
              )}
            </div>
          </article>

          {showEntityColumns && report.items.length > 0 && (
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>Detail</span>
                  <h2>Ranked {report.groupBy} groups</h2>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Papers</th>
                      <th>Citations</th>
                      <th>Growth</th>
                      <th>Score</th>
                      <th>Reliability</th>
                      <th>Suggestion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map((item) => (
                      <tr key={`${item.id ?? item.key}-${item.rank}`}>
                        <td>{item.rank ?? '—'}</td>
                        <td>{item.key}</td>
                        <td>{formatNumber(item.paperCount)}</td>
                        <td>{formatNumber(item.totalCitations)}</td>
                        <td>{formatGrowth(item.growthRate)}</td>
                        <td>
                          {item.trendingScore != null ? Number(item.trendingScore).toFixed(2) : '—'}
                        </td>
                        <td>
                          {item.reliabilityPercent != null
                            ? `${Number(item.reliabilityPercent).toFixed(1)}%`
                            : '—'}
                        </td>
                        <td>{item.suggestion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </>
      ) : null}
    </section>
  )
}

export default PublicationReportPage
