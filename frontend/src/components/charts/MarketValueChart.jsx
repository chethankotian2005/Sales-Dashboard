import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { clsx } from 'clsx'
import { useMarketValue, useSimulateMarketValue } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

export default function MarketValueChart() {
  const [range, setRange] = useState('month')
  const { data, isLoading, error } = useMarketValue(range)
  const simulateMutation = useSimulateMarketValue()

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      simulateMutation.mutate()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) return <ChartSkeleton />
  if (error) return <div className="card text-red-500">Error loading market data</div>

  const chartData = (data || []).map((item) => ({
    time: new Date(item.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: range === 'day' ? '2-digit' : undefined,
    }),
    value: parseFloat(item.value),
    volume: item.volume,
  })).slice(-50) // Show last 50 data points

  const latestValue = chartData[chartData.length - 1]?.value || 0
  const previousValue = chartData[chartData.length - 2]?.value || latestValue
  const change = ((latestValue - previousValue) / previousValue) * 100

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Market Value
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(latestValue)}
            </span>
            <span
              className={clsx(
                'text-sm font-medium',
                change >= 0 ? 'text-success' : 'text-danger'
              )}
            >
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {['day', 'month', 'year'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                range === r
                  ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4361ee" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value) => [formatCurrency(value), 'Value']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4361ee"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mt-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Live updates every 10 seconds
        </span>
      </div>
    </div>
  )
}
