import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/format'

function AnimatedValue({ value, format = 'number', duration = 500 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue
    const endValue = value

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  if (format === 'currency') {
    return formatCurrency(displayValue, true)
  }
  return formatNumber(Math.round(displayValue))
}

function Sparkline({ data, color = '#4361ee', height = 40, width = 80 }) {
  if (!data || data.length === 0) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#gradient-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KPICard({
  title,
  value,
  change,
  format = 'number',
  sparklineData,
  icon: Icon,
  iconBg = 'bg-primary-100 dark:bg-primary-900/30',
  iconColor = 'text-primary-600 dark:text-primary-400',
}) {
  const isPositive = change >= 0

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white animate-count">
            <AnimatedValue value={value} format={format} />
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger" />
              )}
              <span
                className={clsx(
                  'text-sm font-medium',
                  isPositive ? 'text-success' : 'text-danger'
                )}
              >
                {formatPercentage(change)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs last month
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={clsx('p-3 rounded-lg', iconBg)}>
              <Icon className={clsx('w-5 h-5', iconColor)} />
            </div>
          )}
          {sparklineData && (
            <Sparkline data={sparklineData} color={isPositive ? '#2ecc71' : '#e74c3c'} />
          )}
        </div>
      </div>
    </div>
  )
}

export function OrdersCard({ totalOrders, ordersToday, ordersThisWeek }) {
  const [activeTab, setActiveTab] = useState('today')

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Orders
        </p>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('today')}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              activeTab === 'today'
                ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              activeTab === 'week'
                ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            This Week
          </button>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        <AnimatedValue
          value={activeTab === 'today' ? ordersToday : ordersThisWeek}
        />
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {formatNumber(totalOrders)} total orders
      </p>
    </div>
  )
}

export function BalanceCard({ totalBalance, planCost, taxes, extras }) {
  return (
    <div className="card animate-fade-in">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        Total Balance
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        <AnimatedValue value={totalBalance} format="currency" />
      </p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Plan Cost</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(planCost)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Taxes</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(taxes)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Extras</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(extras)}
          </span>
        </div>
      </div>
    </div>
  )
}
