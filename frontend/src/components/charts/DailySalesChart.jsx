import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { useDailySales } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

function RoundedBarShape({ x, y, width, height, hovered, fill }) {
  if (height <= 0) return null

  const radius = Math.min(10, width / 2)
  const path = [
    `M ${x} ${y + height}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + width - radius} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ')

  return (
    <path
      d={path}
      fill={fill}
      style={{
        filter: hovered ? 'drop-shadow(0 4px 12px rgba(124,58,237,0.4))' : 'none',
        transition: 'filter 220ms ease',
      }}
    />
  )
}

export default function DailySalesChart() {
  const { data, isLoading, error } = useDailySales(7)
  const [hoveredBar, setHoveredBar] = useState(-1)

  if (isLoading) return <ChartSkeleton />
  if (error) return <div className="card text-red-500">Error loading sales data</div>

  const chartData = data || []
  const average = useMemo(() => {
    if (!chartData.length) return 0
    const total = chartData.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
    return total / chartData.length
  }, [chartData])

  return (
    <div className="card chart-card-glass h-full flex flex-col animate-chart-reveal">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Daily Sales
      </h3>

      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 14, right: 14, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="dailyBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                <stop offset="100%" stopColor="#4361ee33" stopOpacity={1} />
              </linearGradient>
              <pattern id="dailyStripePattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="rgba(124,58,237,0.04)" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(67,97,238,0.12)" strokeWidth="1" />
              </pattern>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 6"
              stroke="rgba(148,163,184,0.25)"
              fill="url(#dailyStripePattern)"
            />
            <XAxis
              dataKey="date"
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
              cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                border: '1px solid rgba(148,163,184,0.28)',
                borderRadius: '12px',
                boxShadow: '0 16px 36px rgba(2,6,23,0.35)',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#cbd5e1', fontWeight: 600 }}
              formatter={(value) => [formatCurrency(value), 'Revenue']}
              labelFormatter={(label) => `Day ${label}`}
            />
            <ReferenceLine
              y={average}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              label={{
                value: 'Avg',
                fill: '#f59e0b',
                fontSize: 11,
                fontWeight: 600,
                position: 'right',
              }}
            />
            <Bar
              dataKey="revenue"
              fill="url(#dailyBarGradient)"
              maxBarSize={50}
              shape={(props) => <RoundedBarShape {...props} hovered={hoveredBar === props.index} />}
              onMouseMove={(_, index) => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(-1)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.date}
                  className="animate-grow-up"
                  style={{
                    animationDelay: `${index * 80}ms`,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
