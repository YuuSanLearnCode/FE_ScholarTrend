import { useState } from 'react'
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
import { trendByYear } from '../../data/mockData'
import styles from './trendChartPage.module.css'

function TrendChartPage() {
  const [chartType, setChartType] = useState('line')

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h1>Publication Trend Chart</h1>
        <button
          type="button"
          className={styles.button}
          onClick={() => setChartType((prev) => (prev === 'line' ? 'bar' : 'line'))}
        >
          Switch to {chartType === 'line' ? 'Bar' : 'Line'} Chart
        </button>
      </div>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={trendByYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="publications" stroke="#1d4ed8" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={trendByYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="publications" fill="#1d4ed8" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default TrendChartPage
