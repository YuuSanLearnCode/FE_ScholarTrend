import { useEffect, useState } from 'react'
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
import { getPublicationReport } from '../../services/reportService'
import styles from './publicationReportPage.module.css'

function getInitialFilters() {
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
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function PublicationReportPage() {
  const [filters, setFilters] = useState(getInitialFilters)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = async (nextFilters) => {
    setLoading(true)
    setError('')
    try {
      setReport(await getPublicationReport(nextFilters))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report.')
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
          setError(err.response?.data?.message || err.message || 'Failed to load report.')
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

  const handleChange = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (filters.yearFrom && filters.yearTo && Number(filters.yearFrom) > Number(filters.yearTo)) {
      setError('The start year cannot be later than the end year.')
      return
    }
    await loadReport(filters)
  }

  const totalCitations = report?.items.reduce(
    (sum, item) => sum + item.totalCitations,
    0,
  ) ?? 0
  const averageCitations = report?.totalPapers
    ? totalCitations / report.totalPapers
    : 0

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Research reporting</span>
          <h1>Publication Report</h1>
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
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate report'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {loading && !report ? (
        <>
          <div className={styles.statsGrid}>
            <Skeleton variant="card" count={3} />
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
      ) : null}
    </section>
  )
}

export default PublicationReportPage
