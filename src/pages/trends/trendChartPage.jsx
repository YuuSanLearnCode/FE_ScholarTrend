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
import { getTrendByYear } from '../../services/trendService'
import styles from './trendChartPage.module.css'

function TrendChartPage() {
  const [chartType, setChartType] = useState('line')
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTrend() {
      try {
        const result = await getTrendByYear()
        setTrendData(result ?? [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load trend data')
        setTrendData([])
      } finally {
        setLoading(false)
      }
    }
    fetchTrend()
  }, [])

  if (loading) {
    return (
      <section className={styles.panel}>
        <p>Loading...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.panel}>
        <p>{error}</p>
      </section>
    )
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h1 className={styles.title}>Publication Trend Chart</h1>
        <button
          type="button"
          className={styles.button}
          onClick={() => setChartType((prev) => (prev === 'line' ? 'bar' : 'line'))}
        >
          ⇄ Switch to {chartType === 'line' ? 'Bar' : 'Line'} Chart
        </button>
      </div>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 15, 35, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#f1f5f9',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line
                type="monotone"
                dataKey="publications"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                activeDot={{ fill: '#8b5cf6', r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </LineChart>
          ) : (
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 15, 35, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#f1f5f9',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="publications" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default TrendChartPage
