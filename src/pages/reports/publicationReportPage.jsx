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
import { getPublicationReport, exportReportAsCsv } from '../../services/reportService'
import styles from './publicationReportPage.module.css'

function getInitialFilters() {
  const saved = sessionStorage.getItem('publicationReportFilters')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // Ignore invalid JSON
    }
  }
  
  const currentYear = new Date().getFullYear()
  return {
    yearFrom: String(currentYear - 5),
    yearTo: String(currentYear),
    groupBy: 'Year',
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function formatDate(value) {
  const dateStr = value ? (typeof value === 'string' && !value.endsWith('Z') && !value.match(/[+-]\d{2}:?\d{2}$/) ? value + 'Z' : value) : null;
  const date = dateStr ? new Date(dateStr) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function PublicationReportPage({ embedded = false }) {
  const [filters, setFilters] = useState(getInitialFilters)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
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

  const loadReport = async (nextFilters) => {
    setLoading(true)
    setError('')
    setErrorCode(null)
    try {
      setReport(await getPublicationReport(nextFilters))
    } catch (err) {
      handleError(err, 'Failed to load report.')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function fetchInitialReport() {
      try {
        const result = await getPublicationReport(getInitialFilters())
        if (active) setReport(result)
      } catch (err) {
        if (active) {
          handleError(err, 'Failed to load report.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchInitialReport()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('publicationReportFilters', JSON.stringify(filters))
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
    await loadReport(filters)
  }



  const handleExportCsv = async () => {
    try {
      setLoading(true)
      const blob = await exportReportAsCsv(filters)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `publication_report_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      handleError(err, 'Failed to export CSV report.')
    } finally {
      setLoading(false)
    }
  }

  const totalCitations = report?.items.reduce(
    (sum, item) => sum + item.totalCitations,
    0,
  ) ?? 0
  const averageCitations = report?.totalPapers
    ? totalCitations / report.totalPapers
    : 0

  return (
    <section className={`${styles.page} ${embedded ? styles.embeddedPage : ''}`} id="publication-report">
      <header className={`${styles.header} ${embedded ? styles.embeddedHeader : ''}`}>
        <div>
          <span className={styles.eyebrow}>Research reporting</span>
          {embedded ? <h2>Publication Report</h2> : <h1>Publication Report</h1>}
          <p>Analyze publication output and citation impact across a selected period.</p>
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
          <input
            type="text"
            list="report-group-options"
            value={filters.groupBy}
            onChange={handleChange('groupBy')}
            required
          />
          <datalist id="report-group-options">
            <option value="Year" />
            <option value="Month" />
          </datalist>
        </label>
        <div className={styles.buttonGroup}>
          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate report'}
          </button>

          <button type="button" onClick={handleExportCsv} disabled={loading} className={styles.exportBtn}>
            Export CSV
          </button>
        </div>
      </form>

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
            <p>Publication reports are only available for Researcher subscriptions and Admins. Upgrade your plan to unlock deep research analytics, exporting, and more.</p>
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
        embedded ? (
          <div className={styles.embeddedSummary}>
            <Skeleton variant="card" count={3} />
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <Skeleton variant="card" count={3} />
            </div>
            <Skeleton variant="chart" />
          </>
        )
      ) : report ? (
        embedded ? (
          <div className={styles.embeddedSummary}>
            <article>
              <span>Grouped by</span>
              <strong>{report.groupBy || filters.groupBy}</strong>
            </article>
            <article>
              <span>Report groups</span>
              <strong>{formatNumber(report.items.length)}</strong>
            </article>
            <article>
              <span>Citations per paper</span>
              <strong>{averageCitations.toFixed(1)}</strong>
            </article>
          </div>
        ) : (
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
          </div>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Grouped by {report.groupBy || 'report key'}</span>
                <h2>Publications and citations</h2>
              </div>
              <span>{report.yearFrom || filters.yearFrom} - {report.yearTo || filters.yearTo}</span>
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
                    <Line type="monotone" dataKey="totalCitations" name="Citations" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.empty}>No citation data is available.</p>
              )}
            </div>
          </article>
          </>
        )
      ) : null}
    </section>
  )
}

export default PublicationReportPage
