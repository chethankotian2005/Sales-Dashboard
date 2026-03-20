import { useGlobalSales } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ListSkeleton } from '../ui/Skeleton'

export default function GlobalSalesChart() {
  const { data, isLoading, error } = useGlobalSales()

  if (isLoading) return <ListSkeleton items={5} />
  if (error) return <div className="card text-red-500">Error loading global sales</div>

  const maxRevenue = Math.max(...(data || []).map((item) => parseFloat(item.total_revenue)))

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Top Global Sales
      </h3>

      <div className="space-y-4">
        {(data || []).slice(0, 5).map((country, index) => {
          const percentage = (parseFloat(country.total_revenue) / maxRevenue) * 100

          return (
            <div key={country.country_code} className="animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{country.flag_emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {country.country}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(parseFloat(country.total_revenue), true)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {country.total_orders} orders
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {parseFloat(country.percentage).toFixed(1)}% of total
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
