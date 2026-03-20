export const formatCurrency = (value, compact = false) => {
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'k', 'M', 'B']
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3)
    const suffix = suffixes[tier]
    const scale = Math.pow(10, tier * 3)
    const scaled = value / scale
    return `$${scaled.toFixed(1)}${suffix}`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatNumber = (value, compact = false) => {
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'k', 'M', 'B']
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3)
    const suffix = suffixes[tier]
    const scale = Math.pow(10, tier * 3)
    const scaled = value / scale
    return `${scaled.toFixed(1)}${suffix}`
  }

  return new Intl.NumberFormat('en-US').format(value)
}

export const formatPercentage = (value) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getStatusColor = (status) => {
  const colors = {
    pending: 'badge-warning',
    paid: 'badge-success',
    shipped: 'badge-info',
    delivered: 'badge-teal',
    cancelled: 'badge-danger',
  }
  return colors[status] || 'badge-info'
}

export const getSourceColor = (source) => {
  const colors = {
    google: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    direct: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    email: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    referral: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  }
  return colors[source] || colors.direct
}

export const downloadCSV = (data, filename) => {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
