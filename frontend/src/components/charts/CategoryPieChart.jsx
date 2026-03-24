import { useMemo, useState } from 'react'
import { Pie, PieChart, ResponsiveContainer, Tooltip, Sector, Cell } from 'recharts'
import { useCategorySales } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

const PALETTE = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6']

const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    midAngle,
  } = props

  const RADIAN = Math.PI / 180
  const offset = 10
  const dx = Math.cos(-midAngle * RADIAN) * offset
  const dy = Math.sin(-midAngle * RADIAN) * offset

  return (
    <g>
      <Sector
        cx={cx + dx}
        cy={cy + dy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 8px 16px ${fill}44)` }}
      />
      <Sector
        cx={cx + dx}
        cy={cy + dy}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 9}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  )
}

export default function CategoryPieChart() {
  const { data, isLoading, error } = useCategorySales()
  const [activeIndex, setActiveIndex] = useState(0)

  if (isLoading) return <ChartSkeleton />
  if (error) return <div className="card text-red-500">Error loading category data</div>

  const categories = useMemo(() => {
    return (data?.categories || []).map((item, index) => ({
      ...item,
      color: PALETTE[index % PALETTE.length],
    }))
  }, [data])

  const activeCategory = categories[activeIndex]

  return (
    <div className="card chart-card-glass h-full flex flex-col animate-chart-reveal">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>

      <div className="relative flex flex-col items-center">
        <div className="animate-spin-in">
          <ResponsiveContainer width={280} height={280}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {categories.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.92)',
                  border: '1px solid rgba(148,163,184,0.28)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 36px rgba(2,6,23,0.35)',
                  color: '#e2e8f0',
                }}
                labelStyle={{ color: '#cbd5e1', fontWeight: 600 }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center transition-all duration-300">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {activeCategory?.name || 'Category'}
            </p>
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-300 mt-1">
              {formatCurrency(activeCategory?.value || 0, true)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {categories.map((category, index) => (
            <button
              key={category.name}
              onMouseEnter={() => setActiveIndex(index)}
              className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-700/70 border border-slate-200/80 dark:border-slate-600/80 text-xs font-medium text-slate-700 dark:text-slate-200 transition-transform hover:scale-105"
            >
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: category.color }} />
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
