import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from 'recharts'
import { useCategorySales } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

// Custom active shape for interactive pie
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props

  return (
    <g>
      {/* Centered text */}
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#374151" className="dark:fill-white" style={{ fontSize: '14px', fontWeight: 600 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#6b7280" style={{ fontSize: '13px' }}>
        {formatCurrency(value, true)}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#9ca3af" style={{ fontSize: '12px' }}>
        {(percent * 100).toFixed(1)}%
      </text>

      {/* Active sector - slightly larger */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))', cursor: 'pointer' }}
      />

      {/* Inner ring highlight */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 6}
        outerRadius={innerRadius - 2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.6}
      />
    </g>
  )
}

export default function CategoryPieChart() {
  const { data, isLoading, error } = useCategorySales()
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)

  if (isLoading) return <ChartSkeleton />
  if (error) return <div className="card text-red-500">Error loading category data</div>

  const categories = data?.categories || []
  const total = data?.total || 0

  const onPieEnter = (_, index) => {
    setActiveIndex(index)
  }

  const onPieClick = (data, index) => {
    setSelectedCategory(selectedCategory === index ? null : index)
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sales by Category
        </h3>
        {selectedCategory !== null && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            Show All
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        <div className="relative cursor-pointer">
          <ResponsiveContainer width={260} height={260}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onClick={onPieClick}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {categories.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{
                      cursor: 'pointer',
                      opacity: selectedCategory !== null && selectedCategory !== index ? 0.3 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => onPieClick(category, index)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                selectedCategory === index
                  ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-primary-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              } ${selectedCategory !== null && selectedCategory !== index ? 'opacity-40' : ''}`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 transition-transform hover:scale-125"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {category.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(category.value, true)} · {category.percentage.toFixed(1)}%
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Total footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 w-full text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  )
}
