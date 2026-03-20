import { useState } from 'react'
import { Package } from 'lucide-react'
import { usePopularProducts } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { CardSkeleton } from '../ui/Skeleton'

export default function PopularProductsCards() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, isFetching } = usePopularProducts(page)

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Popular Products
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) return <div className="card text-red-500">Error loading products</div>

  const products = data?.results || []
  const hasMore = !!data?.next

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Popular Products
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-12 h-12 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center mb-3 shadow-sm">
              <Package className="w-6 h-6 text-primary-500" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Code: {product.code}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.units_sold} sold
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          disabled={isFetching}
          className="w-full mt-4 py-2 text-sm font-medium text-primary-500 hover:text-primary-600 disabled:opacity-50"
        >
          {isFetching ? 'Loading...' : 'View All'}
        </button>
      )}
    </div>
  )
}
