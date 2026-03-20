import { clsx } from 'clsx'
import { Download } from 'lucide-react'
import { useTopProducts, exportProductsCSV } from '../../api/hooks'
import { formatCurrency, getSourceColor } from '../../utils/format'
import { TableSkeleton } from '../ui/Skeleton'
import toast from 'react-hot-toast'

export default function TopProductsTable() {
  const { data, isLoading, error } = useTopProducts(10)

  const handleExport = async () => {
    try {
      await exportProductsCSV()
      toast.success('Products exported successfully!')
    } catch {
      toast.error('Failed to export products')
    }
  }

  if (isLoading) return <TableSkeleton rows={5} />
  if (error) return <div className="card text-red-500">Error loading products</div>

  const maxSold = Math.max(...(data || []).map((p) => p.units_sold))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Selling Products
        </h3>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sold
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {(data || []).map((product, index) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-500">
                        {product.code.slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.category_name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-4 py-4">
                  {product.discount > 0 ? (
                    <span className="badge badge-success">{product.discount}% OFF</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[100px]">
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${(product.units_sold / maxSold) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                      {product.units_sold.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={clsx('badge capitalize', getSourceColor(product.source))}>
                    {product.source}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
