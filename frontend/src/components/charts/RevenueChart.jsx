import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Download } from 'lucide-react'
import { clsx } from 'clsx'
import { useRevenueChart } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'
import toast from 'react-hot-toast'

export default function RevenueChart() {
  const [period, setPeriod] = useState('week')
  const { data, isLoading, error } = useRevenueChart(period)

  if (isLoading) return <ChartSkeleton height="h-80" />
  if (error) return <div className="card text-red-500">Error loading revenue data</div>

  const chartData = data?.labels?.map((label, index) => ({
    name: label,
    'This Period': data.this_period[index],
    'Last Period': data.last_period[index],
  })) || []

  const handleDownload = () => {
    const csvContent = [
      ['Date', 'This Period', 'Last Period'],
      ...chartData.map(row => [row.name, row['This Period'], row['Last Period']])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${period}.csv`
    a.click()
    toast.success('Report downloaded!')
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Revenue Overview
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                  period === p
                    ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorThisPeriod" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLastPeriod" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value) => [formatCurrency(value), '']}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="This Period"
            stroke="#4361ee"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorThisPeriod)"
          />
          <Area
            type="monotone"
            dataKey="Last Period"
            stroke="#a5b4fc"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLastPeriod)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
