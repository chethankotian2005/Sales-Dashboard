import { useState, useCallback } from 'react'
import { Search, X, Users as UsersIcon, ChevronLeft, ChevronRight, Mail, Phone, MapPin, ShoppingBag, DollarSign, Calendar } from 'lucide-react'
import { useCustomers, useCustomerDetail } from '../api/hooks'
import { formatCurrency, formatDate, debounce } from '../utils/format'
import { TableSkeleton } from '../components/ui/Skeleton'

const AVATAR_COLORS = [
  'bg-primary-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
]

function getInitials(name) {
  if (!name) return '??'
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function Avatar({ name, index, size = 'sm' }) {
  const initials = getInitials(name)
  const color = getAvatarColor(index)
  const sizeClasses = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-10 w-10 text-sm'

  return (
    <div className={`${sizeClasses} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const badgeClass = status === 'Active' ? 'badge badge-success' : 'badge badge-danger'
  return <span className={badgeClass}>{status}</span>
}

function OrderStatusBadge({ status }) {
  const statusMap = {
    pending: 'badge badge-warning',
    paid: 'badge badge-success',
    shipped: 'badge badge-info',
    delivered: 'badge badge-teal',
    cancelled: 'badge badge-danger',
  }
  const badgeClass = statusMap[status] || 'badge badge-info'
  return <span className={badgeClass}>{status}</span>
}

function CustomerDetailPanel({ customerId, onClose, customerIndex }) {
  const { data: customer, isLoading } = useCustomerDetail(customerId)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Panel Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="skeleton h-20 w-20 rounded-full" />
              <div className="skeleton h-6 w-40" />
              <div className="skeleton h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-lg" />
              ))}
            </div>
            <div className="space-y-3 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          </div>
        ) : customer ? (
          <div className="p-6">
            {/* Customer Profile */}
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar name={customer.name} index={customerIndex} size="lg" />
              <h3 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
                {customer.name}
              </h3>
              <StatusBadge status={customer.status} />
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span>
                  {[customer.address, customer.city, customer.country].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <ShoppingBag className="h-5 w-5 text-primary-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customer.total_orders}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(customer.total_spent)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
              </div>
            </div>

            {/* Recent Orders */}
            {customer.recent_orders && customer.recent_orders.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Recent Orders
                </h4>
                <div className="space-y-3">
                  {customer.recent_orders.map((order, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.order_number}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <OrderStatusBadge status={order.status} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(order.date)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {customer.recent_orders && customer.recent_orders.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent orders</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}

export default function Customers() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0)

  const { data, isLoading } = useCustomers(page, search)

  const customers = data?.results || []
  const totalCount = data?.count || 0
  const hasNext = !!data?.next
  const hasPrevious = !!data?.previous
  const pageSize = 10
  const totalPages = Math.ceil(totalCount / pageSize)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value)
      setPage(1)
    }, 400),
    []
  )

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const handleRowClick = (customer, index) => {
    setSelectedCustomerId(customer.id)
    setSelectedCustomerIndex(index)
  }

  const handleClosePanel = () => {
    setSelectedCustomerId(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {totalCount > 0 ? `${totalCount} total customers` : 'Manage your customers'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={handleSearchChange}
            className="input pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : customers.length === 0 ? (
        /* Empty State */
        <div className="card flex flex-col items-center justify-center py-16">
          <UsersIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No customers found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search
              ? `No results for "${search}". Try a different search term.`
              : 'There are no customers to display yet.'}
          </p>
          {search && (
            <button onClick={clearSearch} className="btn btn-secondary mt-4">
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">
                    Customer
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">
                    Phone
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">
                    Orders
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">
                    Total Spent
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">
                    Join Date
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleRowClick(customer, index)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} index={index} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(customer.join_date)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={customer.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrevious}
                className="btn btn-secondary flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                className="btn btn-secondary flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Side Panel */}
      {selectedCustomerId && (
        <CustomerDetailPanel
          customerId={selectedCustomerId}
          customerIndex={selectedCustomerIndex}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
