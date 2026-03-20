import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useDailySales } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

export default function DailySalesChart() {
  const { data, isLoading, error } = useDailySales(7)

  if (isLoading) return <ChartSkeleton />
  if (error) return <div className="card text-red-500">Error loading sales data</div>

  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Daily Sales
      </h3>

      <div className="flex-1 min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4361ee" stopOpacity={1} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" vertical={false} />
          <XAxis
            dataKey="date"
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
            cursor={{ fill: 'rgba(67, 97, 238, 0.1)' }}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, #fff)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value, name) => [formatCurrency(value), 'Revenue']}
            labelFormatter={(label) => `Day: ${label}`}
          />
          <Bar
            dataKey="revenue"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
