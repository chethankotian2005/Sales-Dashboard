import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Loader2, Package } from 'lucide-react'
import { formatCurrency } from '../../utils/format'
import { useUpdateOrderStatus } from '../../api/hooks'

const COLUMNS = [
  { id: 'pending', label: 'Pending', badgeClass: 'badge-warning', bgClass: 'bg-yellow-500' },
  { id: 'processing', label: 'Processing', badgeClass: 'badge-info', bgClass: 'bg-blue-500' },
  { id: 'shipped', label: 'Shipped', badgeClass: 'badge-info', bgClass: 'bg-blue-400' },
  { id: 'delivered', label: 'Delivered', badgeClass: 'badge-success', bgClass: 'bg-green-500' },
  { id: 'cancelled', label: 'Cancelled', badgeClass: 'badge-danger', bgClass: 'bg-red-500' },
]

function OrderCard({ order, isUpdating, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    data: { order, type: 'order' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) {
          onClick?.(order.id)
        }
      }}
      className={`
        relative bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500
        cursor-grab active:cursor-grabbing transition-shadow
        ${isUpdating ? 'pointer-events-none' : ''}
      `}
    >
      {isUpdating && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-700/70 rounded-lg flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-primary-500">
          #{order.order_number || order.id}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {order.total_items ?? order.items_count ?? 0} items
        </span>
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
        {order.customer_name || 'N/A'}
      </p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {formatCurrency(order.total || order.total_amount || 0)}
      </p>
    </div>
  )
}

function OrderCardOverlay({ order }) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-lg border-2 border-primary-500 cursor-grabbing w-[240px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-primary-500">
          #{order.order_number || order.id}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {order.total_items ?? order.items_count ?? 0} items
        </span>
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
        {order.customer_name || 'N/A'}
      </p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {formatCurrency(order.total || order.total_amount || 0)}
      </p>
    </div>
  )
}

function KanbanColumn({ column, orders, updatingOrderId, onOrderClick, isOver }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  })

  const orderCount = orders.length

  return (
    <div className="flex flex-col min-w-[240px] max-w-[280px] flex-1">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${column.bgClass}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {column.label}
        </h3>
        <span className={`badge ${column.badgeClass} ml-auto`}>
          {orderCount}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`
          flex-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 min-h-[400px] space-y-2 overflow-y-auto
          transition-colors duration-200
          ${isOver ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
        `}
      >
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isUpdating={updatingOrderId === order.id}
            onClick={onOrderClick}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
            <Package className="w-6 h-6 mb-1" />
            <span className="text-xs">No orders</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersKanbanBoard({ orders, onOrderClick }) {
  const [activeOrder, setActiveOrder] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [activeColumnId, setActiveColumnId] = useState(null)
  const updateStatus = useUpdateOrderStatus()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const ordersByStatus = useMemo(() => {
    const grouped = {}
    COLUMNS.forEach((col) => {
      grouped[col.id] = []
    })
    orders.forEach((order) => {
      const status = order.status || 'pending'
      if (grouped[status]) {
        grouped[status].push(order)
      }
    })
    return grouped
  }, [orders])

  const handleDragStart = (event) => {
    const { active } = event
    const order = orders.find((o) => o.id === active.id)
    setActiveOrder(order)
  }

  const handleDragOver = (event) => {
    const { over } = event
    if (over?.data?.current?.type === 'column') {
      setActiveColumnId(over.id)
    } else if (over?.data?.current?.type === 'order') {
      setActiveColumnId(over.data.current.order.status)
    } else {
      setActiveColumnId(null)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveOrder(null)
    setActiveColumnId(null)

    if (!over) return

    const draggedOrder = orders.find((o) => o.id === active.id)
    if (!draggedOrder) return

    let newStatus = null

    if (over.data?.current?.type === 'column') {
      newStatus = over.id
    } else if (over.data?.current?.type === 'order') {
      newStatus = over.data.current.order.status
    }

    if (newStatus && newStatus !== draggedOrder.status) {
      setUpdatingOrderId(draggedOrder.id)
      updateStatus.mutate(
        { id: draggedOrder.id, status: newStatus },
        {
          onSettled: () => {
            setUpdatingOrderId(null)
          },
        }
      )
    }
  }

  const handleDragCancel = () => {
    setActiveOrder(null)
    setActiveColumnId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            orders={ordersByStatus[column.id] || []}
            updatingOrderId={updatingOrderId}
            onOrderClick={onOrderClick}
            isOver={activeColumnId === column.id}
          />
        ))}
      </div>
      <DragOverlay>
        {activeOrder && <OrderCardOverlay order={activeOrder} />}
      </DragOverlay>
    </DndContext>
  )
}
