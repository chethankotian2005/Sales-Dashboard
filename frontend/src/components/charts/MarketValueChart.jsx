import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { clsx } from 'clsx'
import { useMarketValue, useSimulateMarketValue } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

export default function MarketValueChart() {
  const [range, setRange] = useState('month')
  const { data, isLoading, error } = useMarketValue(range)
  const simulateMutation = useSimulateMarketValue()

  useEffect(() => {
    const interval = setInterval(() => {
      simulateMutation.mutate()
    }, 10000)

    return () => clearInterval(interval)
  }, [simulateMutation])

  if (isLoading) return <ChartSkeleton />
  if (error) return <div className="card text-red-500">Error loading market data</div>

  const chartData = useMemo(() => {
    return (data || [])
      .map((item) => ({
        time: new Date(item.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: range === 'day' ? '2-digit' : undefined,
        }),
        value: parseFloat(item.value),
      }))
      .slice(-50)
  }, [data, range])

  const latestValue = chartData[chartData.length - 1]?.value || 0
  const previousValue = chartData[chartData.length - 2]?.value || latestValue || 1
  const change = ((latestValue - previousValue) / previousValue) * 100

  return (
    <div className="rounded-card p-6 shadow-card bg-[#0f172a] border border-cyan-500/20 animate-chart-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Market Value</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-cyan-100">{formatCurrency(latestValue)}</span>
            <span className={clsx('text-sm font-medium', change >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-400/30">
            <span className="live-dot" />
            LIVE
          </span>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700/80">
            {['day', 'month', 'year'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                  range === r
                    ? 'bg-slate-700 text-cyan-100'
                    : 'text-slate-400 hover:text-slate-100'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={255}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="marketAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.16)" strokeDasharray="4 8" />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.96)',
              border: '1px solid rgba(34,211,238,0.32)',
              borderRadius: '12px',
              boxShadow: '0 18px 36px rgba(6,182,212,0.22)',
              color: '#cffafe',
            }}
            labelStyle={{ color: '#7dd3fc', fontWeight: 600 }}
            formatter={(value) => [formatCurrency(value), 'Value']}
          />
          <Area type="monotone" dataKey="value" fill="url(#marketAreaGradient)" stroke="none" />
          <Line type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={8} opacity={0.3} dot={false} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00d4ff"
            strokeWidth={3}
            dot={false}
            className="market-line-animated"
            activeDot={{ r: 5, stroke: '#00d4ff', strokeWidth: 2, fill: '#0f172a' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
