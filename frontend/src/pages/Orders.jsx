import { useState, useCallback } from 'react'
import { Search, Filter, Calendar, X, PackageX, Package, MapPin, Clock, LayoutGrid, Table } from 'lucide-react'
import { useOrders, useOrderDetail } from '../api/hooks'
import { formatCurrency, formatDate, formatDateTime, debounce } from '../utils/format'
import { TableSkeleton } from '../components/ui/Skeleton'
import OrdersKanbanBoard from '../components/orders/OrdersKanbanBoard'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_BADGE_MAP = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
}

function getOrderStatusBadge(status) {
  return STATUS_BADGE_MAP[status] || 'badge-info'
}

function OrderDetailModal({ orderId, onClose }) {
  const { data: order, isLoading } = useOrderDetail(orderId)

  if (!orderId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-card shadow-card">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Package className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isLoading ? 'Loading...' : `Order #${order?.order_number || order?.id || ''}`}
              </h2>
              {!isLoading && order && (
                <span className={`badge ${getOrderStatusBadge(order.status)} mt-1`}>
                  {order.status}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="skeleton h-4 w-48 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-32 w-full rounded" />
            <div className="skeleton h-20 w-full rounded" />
          </div>
        ) : order ? (
          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Customer Information
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {order.customer_name || order.customer?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.customer_email || order.customer?.email || 'N/A'}
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </span>
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm text-gray-900 dark:text-white">
                  {order.shipping_address || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {[order.shipping_city, order.shipping_country].filter(Boolean).join(', ') || ''}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Order Items
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                        Product Name
                      </th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                        Code
                      </th>
                      <th className="text-right py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                        Qty
                      </th>
                      <th className="text-right py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                        Unit Price
                      </th>
                      <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className="border-b border-gray-100 dark:border-gray-700/50"
                        >
                          <td className="py-2 pr-4 text-gray-900 dark:text-white">
                            {item.product_name || item.name || 'N/A'}
                          </td>
                          <td className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                            {item.product_code || item.code || '-'}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-900 dark:text-white">
                            {item.quantity}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-500 dark:text-gray-400">
                            {formatCurrency(item.unit_price || item.price || 0)}
                          </td>
                          <td className="py-2 text-right text-gray-900 dark:text-white font-medium">
                            {formatCurrency(item.total || (item.quantity * (item.unit_price || item.price || 0)))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {order.items && order.items.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                        <td colSpan={4} className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                          Order Total
                        </td>
                        <td className="py-3 text-right font-bold text-gray-900 dark:text-white">
                          {formatCurrency(order.total || order.total_amount || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Order Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Order Timeline
                </span>
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="relative space-y-4">
                  {/* Created */}
                  {order.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-primary-500 mt-1.5" />
                        {order.updated_at && order.updated_at !== order.created_at && (
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300 dark:bg-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Order Created
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Updated */}
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Last Updated
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(order.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Order not found.
          </div>
        )}

        {/* Modal Footer */}
        <div className="sticky bottom-0 flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-card">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [viewMode, setViewMode] = useState('table')

  const { data, isLoading } = useOrders(page, search, status, dateFrom, dateTo)

  const orders = data?.results || []
  const totalCount = data?.count || 0
  const hasNext = !!data?.next
  const hasPrevious = !!data?.previous
  const totalPages = Math.ceil(totalCount / 10)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value)
      setPage(1)
    }, 300),
    []
  )

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    setPage(1)
  }

  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value)
    setPage(1)
  }

  const handleDateToChange = (e) => {
    setDateTo(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasActiveFilters = search || status || dateFrom || dateTo

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and track all customer orders.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'board'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name..."
              value={searchInput}
              onChange={handleSearchChange}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={status}
              onChange={handleStatusChange}
              className="input pl-10 pr-8 min-w-[180px] appearance-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={handleDateFromChange}
              className="input pl-10 min-w-[160px]"
              placeholder="From date"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={handleDateToChange}
              className="input pl-10 min-w-[160px]"
              placeholder="To date"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders Content */}
      {isLoading ? (
        viewMode === 'table' ? (
          <TableSkeleton rows={10} />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col min-w-[240px] max-w-[280px] flex-1">
                <div className="skeleton h-6 w-24 rounded mb-3" />
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 min-h-[400px] space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="skeleton h-24 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <PackageX className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              No orders found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              {hasActiveFilters
                ? 'No orders match your current filters. Try adjusting your search criteria.'
                : 'There are no orders to display yet.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-primary mt-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <OrdersKanbanBoard
          orders={orders}
          onOrderClick={(id) => setSelectedOrderId(id)}
        />
      ) : (
        /* Table View */
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-primary-500">
                        #{order.order_number || order.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.customer_name || order.customer?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.customer_email || order.customer?.email || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(order.created_at || order.date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {order.items_count ?? order.items?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(order.total || order.total_amount || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getOrderStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {(page - 1) * 10 + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.min(page * 10, totalCount)}
              </span>
              {' '}of{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {totalCount}
              </span>
              {' '}orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!hasPrevious}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300 px-3">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!hasNext}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}
