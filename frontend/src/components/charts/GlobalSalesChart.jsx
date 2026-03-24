import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useGlobalSales } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ListSkeleton } from '../ui/Skeleton'

const COUNTRY_GRADIENTS = [
  ['#7c3aed', '#4361ee'],
  ['#06b6d4', '#0ea5e9'],
  ['#f59e0b', '#f97316'],
  ['#10b981', '#14b8a6'],
  ['#f43f5e', '#ec4899'],
]

function TinySparkline({ seed }) {
  const points = Array.from({ length: 7 }, (_, index) => {
    const baseline = 14 + (seed % 11)
    const variance = Math.sin((index + seed) * 0.9) * 8
    const x = index * 9
    const y = 26 - (baseline + variance)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="54" height="28" viewBox="0 0 54 28" className="opacity-90">
      <polyline points={points} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function GlobalSalesChart() {
  const { data, isLoading, error } = useGlobalSales()

  if (isLoading) return <ListSkeleton items={5} />
  if (error) return <div className="card text-red-500">Error loading global sales</div>

  const topCountries = (data || []).slice(0, 5)

  return (
    <div className="card chart-card-glass animate-chart-reveal">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Global Sales</h3>

      <div className="space-y-4">
        {topCountries.map((country, index) => {
          const revenue = parseFloat(country.total_revenue)

          return (
            <div
              key={country.country_code}
              className="rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 p-3 animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg leading-none">{country.flag_emoji}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{country.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(revenue, true)}
                  </span>
                  <TinySparkline seed={country.country_code.charCodeAt(0) + index} />
                </div>
              </div>

              <div className="h-11">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: country.country, revenue }]} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`countryGrad-${country.country_code}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={COUNTRY_GRADIENTS[index % COUNTRY_GRADIENTS.length][0]} />
                        <stop offset="100%" stopColor={COUNTRY_GRADIENTS[index % COUNTRY_GRADIENTS.length][1]} />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        border: '1px solid rgba(148,163,184,0.28)',
                        borderRadius: '12px',
                        boxShadow: '0 16px 36px rgba(2,6,23,0.35)',
                        color: '#e2e8f0',
                      }}
                      labelFormatter={() => `${country.flag_emoji} ${country.country}`}
                      formatter={(value) => [formatCurrency(value), 'Sales']}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[8, 8, 8, 8]}
                      isAnimationActive
                      animationBegin={index * 100}
                      animationDuration={900}
                    >
                      <Cell fill={`url(#countryGrad-${country.country_code})`} />
                      <LabelList
                        dataKey="revenue"
                        position="right"
                        style={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                        formatter={(value) => formatCurrency(value, true)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">{country.total_orders} orders</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{parseFloat(country.percentage).toFixed(1)}% share</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
