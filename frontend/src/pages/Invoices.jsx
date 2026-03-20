import { useState, useCallback } from 'react'
import { Search, Filter, Eye, X, FileText, Printer, FileX, ChevronLeft, ChevronRight } from 'lucide-react'
import { useInvoicesList, useInvoiceDetail } from '../api/hooks'
import { formatCurrency, formatDate, debounce } from '../utils/format'
import { TableSkeleton } from '../components/ui/Skeleton'

const PAGE_SIZE = 10

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

function getStatusBadge(status) {
  const map = {
    paid: 'badge-success',
    pending: 'badge-warning',
    overdue: 'badge-danger',
    cancelled: 'badge-danger',
  }
  return map[status] || 'badge-info'
}

/* ------------------------------------------------------------------ */
/*  Invoice Detail Modal                                              */
/* ------------------------------------------------------------------ */
function InvoiceModal({ invoiceId, onClose }) {
  const { data: invoice, isLoading, error } = useInvoiceDetail(invoiceId)

  if (!invoiceId) return null

  const handlePrint = () => {
    window.print()
  }

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:backdrop-blur-none"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl print:shadow-none print:max-h-none print:overflow-visible print:rounded-none">
        {/* Close button - hidden on print */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading && (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading invoice...</p>
          </div>
        )}

        {error && (
          <div className="p-10 text-center text-red-500">
            Failed to load invoice details.
          </div>
        )}

        {invoice && (
          <div className="p-8 print:p-6">
            {/* ---------- Company Header ---------- */}
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
              <div className="flex items-center gap-3">
                {/* Logo placeholder */}
                <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SalesDash</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Management</p>
                </div>
              </div>
              <span className={`badge capitalize ${getStatusBadge(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>

            {/* ---------- Invoice Meta ---------- */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Invoice Number</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                  {invoice.invoice_number}
                </p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Issue Date</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Due Date</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
            </div>

            {/* ---------- Bill To ---------- */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-8 print:bg-gray-50">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Bill To</p>
              <p className="font-semibold text-gray-900 dark:text-white">{invoice.customer_name}</p>
              {invoice.customer_email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer_email}</p>
              )}
              {invoice.customer_address && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{invoice.customer_address}</p>
              )}
            </div>

            {/* ---------- Product Table ---------- */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                    <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Product Name
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Qty
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Unit Price
                    </th>
                    <th className="py-3 pl-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 pr-4 text-gray-900 dark:text-white font-medium">
                      {invoice.product_name}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                      {invoice.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(invoice.unit_price)}
                    </td>
                    <td className="py-3 pl-4 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total_price)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ---------- Total ---------- */}
            <div className="flex justify-end mb-8">
              <div className="w-64 border-t-2 border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Total Amount
                  </span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(invoice.total_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* ---------- Print Button ---------- */}
            <div className="flex justify-end print:hidden">
              <button
                onClick={handlePrint}
                className="btn btn-primary flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Invoices Page                                                */
/* ------------------------------------------------------------------ */
export default function Invoices() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)

  const { data, isLoading, error } = useInvoicesList(page, search, status)

  // Debounced search handler
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

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    setPage(1)
  }

  const invoices = data?.results || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* -------- Page Header -------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage and track all your invoices in one place.
          </p>
        </div>
      </div>

      {/* -------- Filters Card -------- */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice # or customer name..."
              value={searchInput}
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative flex-shrink-0 min-w-[180px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={status}
              onChange={handleStatusChange}
              className="input pl-10 appearance-none cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* -------- Table Card -------- */}
      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} />
      ) : error ? (
        <div className="card text-center py-12 text-red-500">
          <p className="font-medium">Failed to load invoices. Please try again.</p>
        </div>
      ) : invoices.length === 0 ? (
        /* -------- Empty State -------- */
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <FileX className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No invoices found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {search || status
              ? 'No invoices match your current filters. Try adjusting your search or status filter.'
              : 'There are no invoices to display yet.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-slide-in"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* Invoice # */}
                    <td className="px-6 py-4">
                      <span className="font-bold font-mono text-sm text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </span>
                    </td>
                    {/* Customer Name */}
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {invoice.customer_name}
                    </td>
                    {/* Issue Date */}
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invoice.issue_date)}
                    </td>
                    {/* Due Date */}
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invoice.due_date)}
                    </td>
                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total_price)}
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`badge capitalize ${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    {/* View Action */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className="btn btn-secondary inline-flex items-center gap-1.5 text-sm py-1.5 px-3"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.min(page * PAGE_SIZE, totalCount)}
                </span>{' '}
                of{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {totalCount}
                </span>{' '}
                invoices
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, and pages near the current page
                    if (p === 1 || p === totalPages) return true
                    if (Math.abs(p - page) <= 1) return true
                    return false
                  })
                  .reduce((acc, p, idx, arr) => {
                    // Insert ellipsis markers between non-consecutive pages
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push('...' + p)
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item) => {
                    if (typeof item === 'string') {
                      return (
                        <span
                          key={item}
                          className="px-1 text-sm text-gray-400 dark:text-gray-500 select-none"
                        >
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === item
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------- Invoice Modal -------- */}
      {selectedInvoiceId && (
        <InvoiceModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  )
}
