import { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import Spline from '@splinetool/react-spline'

const GBP = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

function DateRangePicker({ min, max, value, onChange }) {
  const [start, end] = value || [min, max]

  return (
    <div className="space-y-2">
      <label className="block text-sm text-slate-300">Select Date Range</label>
      <div className="flex gap-2">
        <input
          type="date"
          className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 w-full"
          min={min}
          max={max}
          value={start}
          onChange={(e) => onChange([e.target.value, end])}
        />
        <input
          type="date"
          className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 w-full"
          min={min}
          max={max}
          value={end}
          onChange={(e) => onChange([start, e.target.value])}
        />
      </div>
    </div>
  )
}

function KPI({ label, value, delta }) {
  const positive = delta >= 0
  return (
    <div className="bg-slate-800/70 backdrop-blur border border-slate-700 rounded-xl p-5">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-3xl font-semibold text-white mt-1">{value}</div>
      <div className={`mt-2 inline-flex items-center text-sm ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        <span className="font-medium">{positive ? '+' : ''}{delta.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function HeroCover() {
  return (
    <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-slate-700">
      <Spline scene="https://prod.spline.design/8nsoLg1te84JZcE9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-900/20 to-slate-900 pointer-events-none" />
      <div className="absolute inset-0 p-6 flex items-end">
        <div>
          <h1 className="text-white text-2xl font-semibold">Partner Performance Reporting</h1>
          <p className="text-slate-300 text-sm">Upload a CSV to explore weekly and monthly performance</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const backend = import.meta.env.VITE_BACKEND_URL || ''
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableRange = analysis?.available_date_range
  const selectedRange = analysis?.selected_date_range

  useEffect(() => {
    if (availableRange && !dateRange) {
      setDateRange([availableRange.min, availableRange.max])
    }
  }, [availableRange, dateRange])

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      if (dateRange) {
        form.append('start_date', dateRange[0])
        form.append('end_date', dateRange[1])
      }
      const res = await fetch(`${backend}/analyze`, { method: 'POST', body: form })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed to analyze')
      setAnalysis(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const kpis = analysis?.kpis
  const daily = analysis?.daily_revenue || []
  const monthly = analysis?.monthly

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm text-slate-300 mb-3">Data Upload</h2>
            <input
              type="file"
              accept=".csv"
              className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {availableRange && (
              <div className="mt-4">
                <DateRangePicker min={availableRange.min} max={availableRange.max} value={dateRange} onChange={setDateRange} />
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2"
            >
              {loading ? 'Analyzing…' : 'Analyze File'}
            </button>
            {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
          </div>
          <div className="hidden md:block"><HeroCover /></div>
        </aside>

        {/* Main */}
        <main className="space-y-6">
          <div className="md:hidden"><HeroCover /></div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <div className="flex gap-3 border-b border-slate-800 mb-4">
              <button className="tab-link active px-3 py-2 rounded-md bg-slate-800">Weekly Overview</button>
              <button className="tab-link px-3 py-2 rounded-md hover:bg-slate-800/60">Monthly Report</button>
            </div>

            {/* Tabs - simple state */}
            <Tabs analysis={analysis} kpis={kpis} daily={daily} monthly={monthly} />
          </div>
        </main>
      </div>
    </div>
  )
}

function Tabs({ analysis, kpis, daily, monthly }) {
  const [tab, setTab] = useState('weekly')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('weekly')} className={`px-3 py-2 rounded-md ${tab==='weekly' ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}>Weekly Overview</button>
        <button onClick={() => setTab('monthly')} className={`px-3 py-2 rounded-md ${tab==='monthly' ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}>Monthly Report</button>
      </div>

      {tab === 'weekly' ? (
        <WeeklyOverview kpis={kpis} daily={daily} />
      ) : (
        <MonthlyReport monthly={monthly} />
      )}
    </div>
  )
}

function WeeklyOverview({ kpis, daily }) {
  if (!kpis) return <EmptyState />

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Billable Clicks" value={kpis.billable_clicks.total.toLocaleString()} delta={kpis.billable_clicks.delta_pct} />
        <KPI label="Billable Calls" value={kpis.billable_calls.total.toLocaleString()} delta={kpis.billable_calls.delta_pct} />
        <KPI label="Total Emails" value={kpis.total_emails.total.toLocaleString()} delta={kpis.total_emails.delta_pct} />
        <KPI label="Total Revenue" value={GBP.format(kpis.total_revenue.total)} delta={kpis.total_revenue.delta_pct} />
      </div>

      {/* Line chart */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="text-slate-300 text-sm mb-2">Daily Revenue</div>
        <Plot
          data={[
            {
              x: daily.map((d) => d.date),
              y: daily.map((d) => d.revenue),
              type: 'scatter',
              mode: 'lines+markers',
              marker: { color: '#818cf8' },
              line: { color: '#818cf8', width: 3 },
              hovertemplate: '%{x}<br>£%{y:.2f}<extra></extra>'
            }
          ]}
          layout={{
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#cbd5e1' },
            margin: { l: 40, r: 20, t: 10, b: 40 },
            xaxis: { gridcolor: '#1f2937' },
            yaxis: { gridcolor: '#1f2937', tickprefix: '£', separatethousands: true },
            showlegend: false,
            height: 320
          }}
          config={{ displayModeBar: false, responsive: true, locale: 'en-GB' }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}

function MonthlyReport({ monthly }) {
  if (!monthly) return <EmptyState />

  const labels = monthly.labels
  const revenue = monthly.revenue

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="text-slate-300 text-sm mb-2">Total Revenue per Month</div>
        <Plot
          data={[
            {
              x: labels,
              y: revenue,
              type: 'bar',
              marker: { color: '#22c55e' },
              hovertemplate: '%{x}<br>£%{y:.2f}<extra></extra>'
            }
          ]}
          layout={{
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#cbd5e1' },
            margin: { l: 40, r: 20, t: 10, b: 40 },
            xaxis: { gridcolor: '#1f2937' },
            yaxis: { gridcolor: '#1f2937', tickprefix: '£', separatethousands: true },
            showlegend: false,
            height: 320
          }}
          config={{ displayModeBar: false, responsive: true, locale: 'en-GB' }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-300">
              <th className="py-2 pr-4">Month</th>
              <th className="py-2 pr-4">Total Clicks</th>
              <th className="py-2 pr-4">Total Calls</th>
              <th className="py-2 pr-4">Total Emails</th>
              <th className="py-2 pr-0">Total Billing (£)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {monthly.table.map((row, i) => (
              <tr key={i} className="text-slate-200">
                <td className="py-2 pr-4">{row['Month']}</td>
                <td className="py-2 pr-4">{Number(row['Total Clicks']).toLocaleString()}</td>
                <td className="py-2 pr-4">{Number(row['Total Calls']).toLocaleString()}</td>
                <td className="py-2 pr-4">{Number(row['Total Emails']).toLocaleString()}</td>
                <td className="py-2 pr-0">{GBP.format(Number(row['Total Billing']))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-slate-400">
      Upload a CSV and click Analyze to see insights.
    </div>
  )
}
