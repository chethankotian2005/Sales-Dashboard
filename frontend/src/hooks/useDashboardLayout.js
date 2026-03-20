import { useState, useCallback } from 'react'

const STORAGE_KEY = 'dashboard_widget_order'

// Default widget order - only includes actually rendered widgets
const DEFAULT_ORDER = [
  'kpi-cards',
  'revenue-chart',
  'daily-sales-category',
  'transactions-global',
  'world-map',
  'invoices-table',
  'products-market',
  'popular-news',
]

export function useDashboardLayout() {
  const [widgetOrder, setWidgetOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Filter to only include widgets that exist in DEFAULT_ORDER
        const validOrder = parsed.filter((id) => DEFAULT_ORDER.includes(id))
        // Add any new widgets that might have been added
        const missingWidgets = DEFAULT_ORDER.filter((id) => !parsed.includes(id))
        // If we have valid widgets, use them; otherwise reset to default
        if (validOrder.length > 0) {
          return [...validOrder, ...missingWidgets]
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard layout:', e)
    }
    return DEFAULT_ORDER
  })

  const [isEditMode, setIsEditMode] = useState(false)

  const saveOrder = useCallback((newOrder) => {
    setWidgetOrder(newOrder)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder))
    } catch (e) {
      console.error('Failed to save dashboard layout:', e)
    }
  }, [])

  const reorderWidgets = useCallback((activeId, overId) => {
    if (activeId === overId) return

    const oldIndex = widgetOrder.indexOf(activeId)
    const newIndex = widgetOrder.indexOf(overId)

    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = [...widgetOrder]
    newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, activeId)

    saveOrder(newOrder)
  }, [widgetOrder, saveOrder])

  const resetToDefault = useCallback(() => {
    saveOrder(DEFAULT_ORDER)
  }, [saveOrder])

  return {
    widgetOrder,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    resetToDefault,
  }
}

export { DEFAULT_ORDER }
