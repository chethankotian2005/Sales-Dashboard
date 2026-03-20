import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './axios'

// KPIs
export const useKPIs = () => {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/kpis/')
      return data
    },
  })
}

// Revenue Chart
export const useRevenueChart = (period = 'week') => {
  return useQuery({
    queryKey: ['revenue', period],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/revenue/?period=${period}`)
      return data
    },
  })
}

// Daily Sales
export const useDailySales = (days = 7) => {
  return useQuery({
    queryKey: ['daily-sales', days],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/daily-sales/?days=${days}`)
      return data
    },
  })
}

// Category Sales
export const useCategorySales = () => {
  return useQuery({
    queryKey: ['category-sales'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/category-sales/')
      return data
    },
  })
}

// Transactions
export const useTransactions = (page = 1) => {
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/transactions/?page=${page}`)
      return data
    },
  })
}

// Invoices
export const useInvoices = (page = 1, search = '', status = '') => {
  return useQuery({
    queryKey: ['invoices', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page)
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      const { data } = await api.get(`/dashboard/invoices/?${params}`)
      return data
    },
  })
}

// Top Products
export const useTopProducts = (limit = 10) => {
  return useQuery({
    queryKey: ['top-products', limit],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/products/top/?limit=${limit}`)
      return data
    },
  })
}

// Popular Products
export const usePopularProducts = (page = 1) => {
  return useQuery({
    queryKey: ['popular-products', page],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/products/popular/?page=${page}`)
      return data
    },
  })
}

// Global Sales
export const useGlobalSales = () => {
  return useQuery({
    queryKey: ['global-sales'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/global-sales/')
      return data
    },
  })
}

// Market Value
export const useMarketValue = (range = 'month') => {
  return useQuery({
    queryKey: ['market-value', range],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/market-value/?range=${range}`)
      return data
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })
}

// Simulate Market Value Update
export const useSimulateMarketValue = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/dashboard/market-value/')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-value'] })
    },
  })
}

// News
export const useNews = (page = 1, filter = '') => {
  return useQuery({
    queryKey: ['news', page, filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page)
      if (filter) params.append('filter', filter)
      const { data } = await api.get(`/dashboard/news/?${params}`)
      return data
    },
  })
}

// Notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/notifications/')
      return data
    },
  })
}

// Unread Notifications Count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/notifications/unread_count/')
      return data
    },
    refetchInterval: 30000, // Check every 30 seconds
  })
}

// Mark Notification Read
export const useMarkRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/dashboard/notifications/${id}/mark_read/`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })
}

// Mark All Notifications Read
export const useMarkAllRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/dashboard/notifications/mark_all_read/')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })
}

// Account Info
export const useAccountInfo = () => {
  return useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/account/')
      return data
    },
  })
}

// Export CSV
export const exportInvoicesCSV = async () => {
  const response = await api.get('/dashboard/invoices/export_csv/', {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'invoices.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const exportProductsCSV = async () => {
  const response = await api.get('/dashboard/products/export_csv/', {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'products.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// ====== Orders Page Hooks ======
export const useOrders = (page = 1, search = '', status = '', dateFrom = '', dateTo = '') => {
  return useQuery({
    queryKey: ['orders', page, search, status, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page)
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (dateFrom) params.append('created_at__date__gte', dateFrom)
      if (dateTo) params.append('created_at__date__lte', dateTo)
      const { data } = await api.get(`/dashboard/orders/?${params}`)
      return data
    },
  })
}

export const useOrderDetail = (id) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/orders/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/dashboard/orders/${id}/`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// ====== Products Page Hooks ======
export const useProductsList = (page = 1, search = '', category = '') => {
  return useQuery({
    queryKey: ['products-list', page, search, category],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page)
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      const { data } = await api.get(`/dashboard/products/?${params}`)
      return data
    },
  })
}

export const useProductDetail = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/products/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productData) => {
      const { data } = await api.post('/dashboard/products/', productData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const { data } = await api.put(`/dashboard/products/${id}/`, productData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/dashboard/products/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
    },
  })
}

// ====== Customers Page Hooks ======
export const useCustomers = (page = 1, search = '') => {
  return useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page)
      if (search) params.append('search', search)
      const { data } = await api.get(`/dashboard/customers/?${params}`)
      return data
    },
  })
}

export const useCustomerDetail = (id) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/customers/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

// ====== Invoices Page Hooks ======
export const useInvoicesList = (page = 1, search = '', status = '') => {
  return useQuery({
    queryKey: ['invoices-page', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('page_size', 10)
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      const { data } = await api.get(`/dashboard/invoices/?${params}`)
      return data
    },
  })
}

export const useInvoiceDetail = (id) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/invoices/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

// ====== Analytics Page Hooks ======
export const useAnalyticsSummary = () => {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/analytics/')
      return data
    },
  })
}

// ====== Categories Hook ======
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/categories/')
      return data
    },
  })
}
