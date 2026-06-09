import { useEffect, useState } from 'react'
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
import { getTrendByYear, getKeywordTrends, getTopicTrends } from '../../services/trendService'
import Skeleton from '../../components/Skeleton'
import styles from './trendChartPage.module.css'

const COLORS = ['#1e40af', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0d9488']

function TrendChartPage() {
  const [chartType, setChartType] = useState('line')
  const [trendData, setTrendData] = useState([])
  const [keywordData, setKeywordData] = useState([])
  const [topicData, setTopicData] = useState([])
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [trend, keywords, topics] = await Promise.all([
          getTrendByYear(),
          getKeywordTrends(10),
          getTopicTrends(10),
        ])
        setTrendData(trend ?? [])
        setKeywordData(Array.isArray(keywords) ? keywords.map((k) => ({
          name: k.keyword || k.name || k.topic || String(k),
          value: k.count || k.publications || 0,
        })) : [])
        setTopicData(Array.isArray(topics) ? topics.map((t) => ({
          name: t.name || t.topic || String(t),
          value: t.count || t.publications || 0,
        })) : [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load trend data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleFilter = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (selectedKeyword) params.keyword = selectedKeyword
      if (yearFrom) params.yearFrom = yearFrom
      if (yearTo) params.yearTo = yearTo
      const result = await getTrendByYear(params)
      setTrendData(result ?? [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to filter trend data')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !trendData.length) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" />
        <Skeleton variant="chart" />
      </section>
    )
  }

  if (error && !trendData.length) {
    return (
      <section className={styles.page}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Publication Trends</h1>
      </div>

      {/* Filters */}
      <div className={styles.panel}>
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Keyword</label>
            <select className={styles.select} value={selectedKeyword} onChange={(e) => setSelectedKeyword(e.target.value)}>
              <option value="">All keywords</option>
              {keywordData.map((k) => (
                <option key={k.name} value={k.name}>{k.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Year From</label>
            <input type="number" className={styles.input} value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="e.g. 2015" min="1900" max="2030" />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Year To</label>
            <input type="number" className={styles.input} value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="e.g. 2025" min="1900" max="2030" />
          </div>
          <button type="button" className={styles.button} onClick={handleFilter}>Apply Filter</button>
        </div>
      </div>

      {/* Publications by Year */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Publications by Year</h2>
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => setChartType((prev) => (prev === 'line' ? 'bar' : 'line'))}
          >
            ⇄ {chartType === 'line' ? 'Bar' : 'Line'}
          </button>
        </div>
        <div className={styles.chartWrap}>
          {loading ? <Skeleton variant="chart" /> : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }} labelStyle={{ color: '#475569' }} />
                  <Line type="monotone" dataKey="publications" stroke="url(#lineGradient)" strokeWidth={3} dot={{ fill: '#1e40af', r: 4, strokeWidth: 0 }} activeDot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }} />
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1e40af" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </LineChart>
              ) : (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }} labelStyle={{ color: '#475569' }} />
                  <Bar dataKey="publications" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1e40af" />
                    </linearGradient>
                  </defs>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Top Keywords */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Top Keywords</h2>
          <div className={styles.chartWrapSmall}>
            {keywordData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" tick={{ fill: '#475569', fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyText}>No keyword data available.</p>
            )}
          </div>
        </div>

        {/* Top Topics */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Top Topics</h2>
          <div className={styles.chartWrapSmall}>
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topicData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {topicData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyText}>No topic data available.</p>
            )}
          </div>
          {/* Topic legend */}
          {topicData.length > 0 && (
            <div className={styles.legend}>
              {topicData.slice(0, 5).map((t, i) => (
                <span key={t.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default TrendChartPage
