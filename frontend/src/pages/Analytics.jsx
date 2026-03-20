import { useState, useRef, useMemo } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, RotateCcw, Download, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Area, AreaChart,
  ComposedChart, Line, Legend
} from 'recharts'
import { useAnalyticsSummary, useDailySales } from '../api/hooks'
import { formatCurrency, formatNumber } from '../utils/format'
import { CardSkeleton, ChartSkeleton } from '../components/ui/Skeleton'
import { generateAnalyticsPDF } from '../utils/pdfExport'
import { generateSalesForecast, combineDataForChart, formatDateForChart } from '../utils/forecast'

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const ForecastTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const actualEntry = payload.find((p) => p.dataKey === 'actual')
    const forecastEntry = payload.find((p) => p.dataKey === 'forecast')

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[150px]">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {formatDateForChart(label)}
        </p>
        {actualEntry?.value != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Actual:</span>
            <span className="text-sm font-semibold text-blue-600">{formatCurrency(actualEntry.value)}</span>
          </div>
        )}
        {forecastEntry?.value != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Forecast:</span>
            <span className="text-sm font-semibold text-orange-500">{formatCurrency(forecastEntry.value)}</span>
          </div>
        )}
      </div>
    )
  }
  return null
}

const kpiConfig = [
  {
    key: 'total_revenue',
    title: 'Total Revenue',
    icon: DollarSign,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    format: 'currency',
  },
  {
    key: 'conversion_rate',
    title: 'Conversion Rate',
    icon: TrendingUp,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    format: 'percentage',
  },
  {
    key: 'avg_order_value',
    title: 'Avg Order Value',
    icon: ShoppingCart,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    format: 'currency',
  },
  {
    key: 'return_rate',
    title: 'Return Rate',
    icon: RotateCcw,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    format: 'percentage',
  },
]

const formatKPIValue = (value, format) => {
  const safeValue = value ?? 0
  if (format === 'currency') return formatCurrency(safeValue)
  if (format === 'percentage') return `${safeValue.toFixed(1)}%`
  return formatNumber(safeValue)
}

export default function Analytics() {
  const { data, isLoading } = useAnalyticsSummary()
  const { data: dailySalesData, isLoading: isForecastLoading } = useDailySales(90)
  const [isExporting, setIsExporting] = useState(false)

  // Refs for chart capture
  const revenueByCategoryRef = useRef(null)
  const salesTrendRef = useRef(null)
  const topProductsRef = useRef(null)
  const customerAcquisitionRef = useRef(null)

  // Generate forecast data
  const forecastData = useMemo(() => {
    if (!dailySalesData || dailySalesData.length === 0) {
      return { chartData: [], projectedRevenue: 0 }
    }

    // Map API data to forecast format
    const historicalData = dailySalesData.map((d) => ({
      date: d.date || d.day,
      revenue: d.revenue || d.total || d.sales || 0,
    }))

    const { historical, forecast, projectedRevenue } = generateSalesForecast(
      historicalData,
      30, // forecast 30 days
      15  // 15% confidence band
    )

    const chartData = combineDataForChart(historical, forecast)

    return { chartData, projectedRevenue }
  }, [dailySalesData])

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await generateAnalyticsPDF({
        kpis: data,
        topProducts: data?.top_products || [],
        chartRefs: {
          revenueByCategory: revenueByCategoryRef.current,
          salesTrend: salesTrendRef.current,
          topProducts: topProductsRef.current,
          customerAcquisition: customerAcquisitionRef.current,
        },
      })
    } catch (error) {
      console.error('Failed to export PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Detailed insights into your business performance
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isLoading || isExporting}
          className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? 'Generating...' : 'Export PDF Report'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          kpiConfig.map((kpi) => {
            const Icon = kpi.icon
            return (
              <div key={kpi.key} className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {kpi.title}
                  </p>
                  <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                    <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatKPIValue(data?.[kpi.key] || 0, kpi.format)}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Revenue by Category & Sales Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category - Bar Chart */}
        {isLoading ? (
          <ChartSkeleton height="h-80" />
        ) : (
          <div className="card" ref={revenueByCategoryRef}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue by Category
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.revenue_by_category || []}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                    tickFormatter={(v) => formatCurrency(v, true)}
                  />
                  <Tooltip
                    content={<CustomTooltip formatter={(v) => formatCurrency(v)} />}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {(data?.revenue_by_category || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sales Trend - Area/Line Chart with Gradient */}
        {isLoading ? (
          <ChartSkeleton height="h-80" />
        ) : (
          <div className="card" ref={salesTrendRef}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sales Trend
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.sales_trend || []}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                    tickFormatter={(v) => formatCurrency(v, true)}
                  />
                  <Tooltip
                    content={<CustomTooltip formatter={(v) => formatCurrency(v)} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4361ee"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top Products & Customer Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products by Revenue - Horizontal Bar Chart */}
        {isLoading ? (
          <ChartSkeleton height="h-80" />
        ) : (
          <div className="card" ref={topProductsRef}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Products by Revenue
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={(data?.top_products || []).slice(0, 5)}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                    tickFormatter={(v) => formatCurrency(v, true)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                    width={120}
                  />
                  <Tooltip
                    content={<CustomTooltip formatter={(v) => formatCurrency(v)} />}
                  />
                  <Bar dataKey="revenue" fill="#7209b7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Customer Acquisition - Bar Chart */}
        {isLoading ? (
          <ChartSkeleton height="h-80" />
        ) : (
          <div className="card" ref={customerAcquisitionRef}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Customer Acquisition
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.customer_acquisition || []}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip
                    content={<CustomTooltip formatter={(v) => formatNumber(v)} />}
                  />
                  <Bar dataKey="customers" fill="#2ecc71" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Sales Forecast Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sales Forecast
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              30-day forecast based on 90 days of historical data
            </p>
          </div>
          {!isForecastLoading && forecastData.projectedRevenue > 0 && (
            <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Projected Revenue (Next 30 days)
                </p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(forecastData.projectedRevenue)}
                </p>
              </div>
            </div>
          )}
        </div>

        {isForecastLoading ? (
          <div className="h-80">
            <ChartSkeleton height="h-full" />
          </div>
        ) : forecastData.chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No historical data available for forecast
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecastData.chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatDateForChart}
                  interval="preserveStartEnd"
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => formatCurrency(v, true)}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip content={<ForecastTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {value === 'actual' ? 'Historical' : value === 'forecast' ? 'Forecast' : value}
                    </span>
                  )}
                />

                {/* Confidence Band (±15%) */}
                <Area
                  type="monotone"
                  dataKey="forecastUpper"
                  stroke="none"
                  fill="url(#forecastBand)"
                  fillOpacity={1}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecastLower"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  connectNulls={false}
                />

                {/* Historical Data - Solid Blue Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#4361ee"
                  strokeWidth={2}
                  dot={false}
                  name="actual"
                  connectNulls={false}
                />

                {/* Forecast Data - Dashed Orange Line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="forecast"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
