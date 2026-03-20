import { useMemo } from 'react'
import { DollarSign, ShoppingCart, Settings, X, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useKPIs } from '../api/hooks'
import { KPICard, OrdersCard, BalanceCard } from '../components/cards/KPICards'
import RevenueChart from '../components/charts/RevenueChart'
import DailySalesChart from '../components/charts/DailySalesChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import MarketValueChart from '../components/charts/MarketValueChart'
import GlobalSalesChart from '../components/charts/GlobalSalesChart'
import WorldMapChart from '../components/charts/WorldMapChart'
import InvoicesTable from '../components/tables/InvoicesTable'
import TopProductsTable from '../components/tables/TopProductsTable'
import TransactionsList from '../components/tables/TransactionsList'
import PopularProductsCards from '../components/cards/PopularProductsCards'
import NewsFeed from '../components/cards/NewsFeed'
import { CardSkeleton } from '../components/ui/Skeleton'
import DashboardGrid from '../components/dashboard/DashboardGrid'
import { useDashboardLayout } from '../hooks/useDashboardLayout'

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useKPIs()
  const {
    widgetOrder,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    resetToDefault,
  } = useDashboardLayout()

  const handleToggleEditMode = () => {
    if (isEditMode) {
      toast.success('Layout saved!', {
        icon: '✓',
        duration: 2000,
      })
    }
    setIsEditMode(!isEditMode)
  }

  const handleResetLayout = () => {
    resetToDefault()
    toast.success('Layout reset to default!', {
      duration: 2000,
    })
  }

  // Define all widget components - no null placeholders
  const widgetComponents = useMemo(() => ({
    'kpi-cards': {
      component: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpisLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <KPICard
                title="This Month Revenue"
                value={kpis?.revenue || 0}
                change={kpis?.revenue_change || 0}
                format="currency"
                sparklineData={kpis?.sparkline_data}
                icon={DollarSign}
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600 dark:text-green-400"
              />
              <KPICard
                title="Total Sales Units"
                value={kpis?.sales_units || 0}
                change={kpis?.sales_units_change || 0}
                format="number"
                icon={ShoppingCart}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <OrdersCard
                totalOrders={kpis?.total_orders || 0}
                ordersToday={kpis?.orders_today || 0}
                ordersThisWeek={kpis?.orders_this_week || 0}
              />
              <BalanceCard
                totalBalance={kpis?.total_balance || 0}
                planCost={kpis?.plan_cost || 0}
                taxes={kpis?.taxes || 0}
                extras={kpis?.extras || 0}
              />
            </>
          )}
        </div>
      ),
    },
    'revenue-chart': {
      component: <RevenueChart />,
    },
    'daily-sales-category': {
      component: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DailySalesChart />
          </div>
          <div className="lg:col-span-1">
            <CategoryPieChart />
          </div>
        </div>
      ),
    },
    'transactions-global': {
      component: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionsList />
          <GlobalSalesChart />
        </div>
      ),
    },
    'world-map': {
      component: <WorldMapChart />,
    },
    'invoices-table': {
      component: <InvoicesTable />,
    },
    'products-market': {
      component: (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TopProductsTable />
          <MarketValueChart />
        </div>
      ),
    },
    'popular-news': {
      component: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PopularProductsCards />
          </div>
          <div className="lg:col-span-2">
            <NewsFeed />
          </div>
        </div>
      ),
    },
  }), [kpis, kpisLoading])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your sales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <button
              onClick={handleResetLayout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                         text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700
                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={handleToggleEditMode}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${isEditMode
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
              }
            `}
          >
            {isEditMode ? (
              <>
                <X className="w-4 h-4" />
                Done
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Customize Dashboard
              </>
            )}
          </button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
                        rounded-lg p-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">Customize Mode:</span> Drag widgets to reorder them.
            Click "Done" when finished to save your layout.
          </p>
        </div>
      )}

      {/* Dashboard Widgets */}
      <DashboardGrid
        widgetOrder={widgetOrder}
        isEditMode={isEditMode}
        onReorder={reorderWidgets}
        widgetComponents={widgetComponents}
      />
    </div>
  )
}
