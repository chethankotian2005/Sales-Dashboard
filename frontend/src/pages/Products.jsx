import { useState, useCallback } from 'react'
import {
  Search, Plus, LayoutGrid, List, Edit2, Trash2, X, PackageX, Package,
  Cpu, ShoppingBag, Star, Home, Activity,
} from 'lucide-react'
import { useProductsList, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories } from '../api/hooks'
import { formatCurrency, debounce } from '../utils/format'
import { TableSkeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'

const CATEGORY_VISUALS = {
  electronics: {
    bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/60',
    iconColor: 'text-blue-500',
    Icon: Cpu,
  },
  apparel: {
    bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/60',
    iconColor: 'text-purple-500',
    Icon: ShoppingBag,
  },
  accessories: {
    bg: 'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/60',
    iconColor: 'text-pink-500',
    Icon: Star,
  },
  'home-garden': {
    bg: 'bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/60',
    iconColor: 'text-teal-500',
    Icon: Home,
  },
  sports: {
    bg: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/60',
    iconColor: 'text-green-500',
    Icon: Activity,
  },
}

const DEFAULT_VISUAL = {
  bg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
  iconColor: 'text-gray-400',
  Icon: Package,
}

const ITEMS_PER_PAGE = 12

const initialFormState = {
  name: '',
  price: '',
  category: '',
  stock: '',
  description: '',
}

function getStockBadge(stockStatus) {
  switch (stockStatus) {
    case 'in_stock':
      return { label: 'In Stock', className: 'badge badge-success' }
    case 'low_stock':
      return { label: 'Low Stock', className: 'badge badge-warning' }
    case 'out_of_stock':
      return { label: 'Out of Stock', className: 'badge badge-danger' }
    default:
      return { label: stockStatus || 'Unknown', className: 'badge' }
  }
}

function generateProductCode(categorySlug) {
  const prefix = (categorySlug || 'GEN').toUpperCase().slice(0, 3)
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${randomNum}`
}

export default function Products() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data: productsData, isLoading } = useProductsList(page, search, categoryFilter)
  const { data: categories } = useCategories()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const products = productsData?.results || []
  const totalCount = productsData?.count || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Debounced search handler
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

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value)
    setPage(1)
  }

  // Modal handlers
  const openAddModal = () => {
    setEditingProduct(null)
    setFormData(initialFormState)
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      price: product.price || '',
      category: product.category || '',
      stock: product.stock || '',
      description: product.description || '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData(initialFormState)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.category || !formData.stock) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock, 10),
          description: formData.description,
        })
        toast.success('Product updated successfully')
      } else {
        const selectedCategory = categories?.find(
          (cat) => String(cat.id) === String(formData.category)
        )
        const code = generateProductCode(selectedCategory?.slug)
        await createProduct.mutateAsync({
          name: formData.name,
          code,
          price: parseFloat(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock, 10),
          description: formData.description,
        })
        toast.success('Product created successfully')
      }
      closeModal()
    } catch (error) {
      toast.error(
        editingProduct
          ? 'Failed to update product'
          : 'Failed to create product'
      )
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteProduct.mutateAsync(id)
      toast.success('Product deleted successfully')
      setDeleteConfirm(null)
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  // Pagination handlers
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const getCategoryName = (categoryId) => {
    const cat = categories?.find((c) => String(c.id) === String(categoryId))
    return cat?.name || 'Uncategorized'
  }

  const getCategoryVisual = (categoryId) => {
    const cat = categories?.find((c) => String(c.id) === String(categoryId))
    return CATEGORY_VISUALS[cat?.slug] || DEFAULT_VISUAL
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your product inventory</p>
          </div>
        </div>
        <TableSkeleton rows={8} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your product inventory</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={handleSearchChange}
              className="input pl-10 w-full"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={handleCategoryChange}
            className="input min-w-[180px]"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 && !isLoading && (
        <div className="card flex flex-col items-center justify-center py-16">
          <PackageX className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
            No products found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search || categoryFilter
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first product.'}
          </p>
          {!search && !categoryFilter && (
            <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {products.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const stockBadge = getStockBadge(product.stock_status)
            return (
              <div
                key={product.id}
                className="card hover:shadow-lg transition-shadow duration-200 flex flex-col"
              >
                {/* Product Image */}
                {(() => {
                  const visual = getCategoryVisual(product.category)
                  const Icon = visual.Icon
                  return (
                    <div className={`${visual.bg} rounded-xl flex items-center justify-center h-40 mb-4 overflow-hidden`}>
                      <Icon className={`w-16 h-16 ${visual.iconColor} opacity-60`} />
                    </div>
                  )
                })()}

                {/* Product Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-2">
                    {product.code}
                  </p>

                  <div className="mb-3">
                    <span className="badge badge-info text-xs">
                      {getCategoryName(product.category)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Stock: {product.stock}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className={stockBadge.className}>{stockBadge.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {products.length > 0 && viewMode === 'list' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                  Product
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                  SKU Code
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                  Category
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                  Price
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                  Stock
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stockBadge = getStockBadge(product.stock_status)
                return (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const visual = getCategoryVisual(product.category)
                          const Icon = visual.Icon
                          return (
                            <div className={`w-10 h-10 ${visual.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-5 h-5 ${visual.iconColor}`} />
                            </div>
                          )
                        })()}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {product.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-info text-xs">
                        {getCategoryName(product.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {product.stock}
                    </td>
                    <td className="py-3 px-4">
                      <span className={stockBadge.className}>{stockBadge.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} products
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="btn btn-secondary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true
                if (p === 1 || p === totalPages) return true
                if (Math.abs(p - page) <= 1) return true
                return false
              })
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) {
                  acc.push('ellipsis-' + p)
                }
                acc.push(p)
                return acc
              }, [])
              .map((item) => {
                if (typeof item === 'string') {
                  return (
                    <span
                      key={item}
                      className="px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500"
                    >
                      ...
                    </span>
                  )
                }
                return (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      item === page
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item}
                  </button>
                )
              })}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="btn btn-secondary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter product name"
                  className="input w-full"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="input w-full"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="input w-full"
                  required
                >
                  <option value="">Select a category</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleFormChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="input w-full"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter product description (optional)"
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              {/* Auto-generated Code Note */}
              {!editingProduct && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Product code will be auto-generated based on the selected category.
                </p>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(createProduct.isPending || updateProduct.isPending) && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />

          {/* Confirmation Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Product
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {deleteConfirm.name}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={deleteProduct.isPending}
                  className="btn flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteProduct.isPending && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
