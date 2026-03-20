import { useState } from 'react'
import { clsx } from 'clsx'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useInvoices, exportInvoicesCSV } from '../../api/hooks'
import { formatCurrency, formatDate, getStatusColor } from '../../utils/format'
import { TableSkeleton } from '../ui/Skeleton'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function InvoicesTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const { data, isLoading, error } = useInvoices(page, search, status)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleExport = async () => {
    try {
      await exportInvoicesCSV()
      toast.success('Invoices exported successfully!')
    } catch {
      toast.error('Failed to export invoices')
    }
  }

  if (isLoading) return <TableSkeleton rows={5} />
  if (error) return <div className="card text-red-500">Error loading invoices</div>

  const invoices = data?.results || []
  const totalPages = Math.ceil((data?.count || 0) / 5)

  return (
    <div className="card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Monthly Invoices
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 pr-4 py-2 w-full sm:w-48 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'customer_name', label: 'Customer' },
                { key: 'product_name', label: 'Product' },
                { key: 'invoice_number', label: 'Invoice #' },
                { key: 'total_price', label: 'Price' },
                { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Date' },
              ].map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {column.label}
                  {sortField === column.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {invoices.map((invoice, index) => (
              <tr
                key={invoice.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {invoice.customer_name}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                  {invoice.product_name}
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {invoice.invoice_number}
                  </span>
                </td>
                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                  {formatCurrency(invoice.total_price)}
                </td>
                <td className="px-4 py-4">
                  <span className={clsx('badge capitalize', getStatusColor(invoice.status))}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-600 dark:text-gray-400 text-sm">
                  {formatDate(invoice.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * 5 + 1} to {Math.min(page * 5, data?.count || 0)} of {data?.count || 0} results
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-900 dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
