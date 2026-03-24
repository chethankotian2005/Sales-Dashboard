import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useRevenueChart } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

function DiamondDot({ cx, cy, stroke }) {
  if (cx === undefined || cy === undefined) return null

  return (
    <path
      d={`M ${cx} ${cy - 5} L ${cx + 5} ${cy} L ${cx} ${cy + 5} L ${cx - 5} ${cy} Z`}
      fill={stroke}
      stroke="#ffffff"
      strokeWidth={1.2}
      style={{ filter: `drop-shadow(0 0 6px ${stroke}66)` }}
    />
  )
}

export default function RevenueChart() {
  const [period, setPeriod] = useState('week')
  const [isHovering, setIsHovering] = useState(false)
  const { data, isLoading, error } = useRevenueChart(period)

  if (isLoading) return <ChartSkeleton height="h-80" />
  if (error) return <div className="card text-red-500">Error loading revenue data</div>

  const chartData = useMemo(() => {
    return data?.labels?.map((label, index) => ({
      name: label,
      thisWeek: data.this_period[index],
      lastWeek: data.last_period[index],
    })) || []
  }, [data])

  const handleDownload = () => {
    const csvContent = [
      ['Date', 'This Period', 'Last Period'],
      ...chartData.map((row) => [row.name, row.thisWeek, row.lastWeek]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${period}.csv`
    a.click()
    toast.success('Report downloaded!')
  }

  return (
    <div className="card chart-card-glass animate-chart-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100/80 dark:bg-gray-700/60 rounded-lg p-1 backdrop-blur-sm">
            {['week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                  period === p
                    ? 'bg-white/90 dark:bg-slate-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      <div
        className={clsx('transition-all duration-300', isHovering && 'animate-gradient-shift')}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="glassThisWeek" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0)" />
              </linearGradient>
              <linearGradient id="glassLastWeek" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(6,182,212,0.22)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="rgba(241,245,249,0.9)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value, true)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                border: '1px solid rgba(148,163,184,0.28)',
                borderRadius: '12px',
                boxShadow: '0 16px 36px rgba(2,6,23,0.35)',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#cbd5e1', fontWeight: 600 }}
              formatter={(value, name) => [formatCurrency(value), name === 'thisWeek' ? 'This Week' : 'Last Week']}
            />
            <Legend
              formatter={(value) => (value === 'thisWeek' ? 'This Week' : 'Last Week')}
              wrapperStyle={{ paddingTop: 10 }}
            />
            <Area
              type="monotone"
              dataKey="lastWeek"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill="url(#glassLastWeek)"
              fillOpacity={1}
              dot={(props) => <DiamondDot {...props} stroke="#06b6d4" />}
              activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#0f172a' }}
              animationDuration={1000}
            />
            <Area
              type="monotone"
              dataKey="thisWeek"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#glassThisWeek)"
              fillOpacity={1}
              dot={(props) => <DiamondDot {...props} stroke="#6366f1" />}
              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#0f172a' }}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
