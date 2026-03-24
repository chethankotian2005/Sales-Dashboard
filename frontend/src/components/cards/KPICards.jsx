import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useCountUp } from '../../hooks/useCountUp'
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/format'

function AnimatedValue({ value, format = 'number' }) {
  const count = useCountUp(Number(value) || 0, 1000)

  if (format === 'currency') {
    return formatCurrency(count, true)
  }

  return formatNumber(Math.round(count))
}

function Sparkline({ data, color = '#4361ee', height = 40, width = 86 }) {
  const values = data?.length
    ? data.slice(0, 10)
    : Array.from({ length: 10 }, (_, index) => 18 + Math.sin(index * 0.8) * 9)

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`kpiGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#kpiGradient-${color.replace('#', '')})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function KPIContainer({ children, border, mesh = 'mesh-bg-purple' }) {
  return (
    <div
      className={clsx(
        'kpi-gradient-border animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(15,23,42,0.2)]',
        mesh
      )}
      style={{ '--kpi-border': border }}
    >
      <div className="kpi-content p-5">{children}</div>
    </div>
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
  const accent = isPositive ? '#10b981' : '#f43f5e'

  return (
    <KPIContainer border="conic-gradient(from 0deg, #7c3aed, #06b6d4, #10b981, #f59e0b, #7c3aed)" mesh="mesh-bg-purple">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            <AnimatedValue value={value} format={format} />
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
              <span className={clsx('text-sm font-medium', isPositive ? 'text-emerald-500' : 'text-rose-500')}>
                {formatPercentage(change)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={clsx('p-3 rounded-lg border border-white/30 dark:border-slate-700/60', iconBg)}>
            <Icon className={clsx('w-5 h-5', iconColor)} />
          </div>
        )}
      </div>

      <div className="flex justify-end mt-2">
        <Sparkline data={sparklineData} color={accent} />
      </div>
    </KPIContainer>
  )
}

export function OrdersCard({ totalOrders, ordersToday, ordersThisWeek }) {
  const [activeTab, setActiveTab] = useState('today')
  const activeValue = activeTab === 'today' ? ordersToday : ordersThisWeek
  const sparklineData = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const base = Number(activeValue || 0)
        return base * (0.65 + index * 0.05) + Math.sin(index) * 3
      }),
    [activeValue]
  )

  return (
    <KPIContainer border="conic-gradient(from 40deg, #06b6d4, #4361ee, #7c3aed, #06b6d4)" mesh="mesh-bg-cyan">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
        <div className="flex bg-white/70 dark:bg-slate-700/70 rounded-lg p-1 border border-slate-200/70 dark:border-slate-600/70">
          <button
            onClick={() => setActiveTab('today')}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              activeTab === 'today'
                ? 'bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300'
            )}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              activeTab === 'week'
                ? 'bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-300'
            )}
          >
            This Week
          </button>
        </div>
      </div>

      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        <AnimatedValue value={activeValue} />
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatNumber(totalOrders)} total orders</p>

      <div className="flex justify-end mt-2">
        <Sparkline data={sparklineData} color="#06b6d4" />
      </div>
    </KPIContainer>
  )
}

export function BalanceCard({ totalBalance, planCost, taxes, extras }) {
  const sparklineData = useMemo(
    () => Array.from({ length: 10 }, (_, index) => Number(totalBalance || 0) * (0.55 + index * 0.04)),
    [totalBalance]
  )

  return (
    <KPIContainer border="conic-gradient(from 20deg, #10b981, #f59e0b, #7c3aed, #10b981)" mesh="mesh-bg-emerald">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        <AnimatedValue value={totalBalance} format="currency" />
      </p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Plan Cost</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(planCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Taxes</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(taxes)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Extras</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(extras)}</span>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Sparkline data={sparklineData} color="#10b981" />
      </div>
    </KPIContainer>
  )
}
