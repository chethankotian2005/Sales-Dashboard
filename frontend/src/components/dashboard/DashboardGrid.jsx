import { useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import DraggableWidget from './DraggableWidget'

export default function DashboardGrid({
  widgetOrder,
  isEditMode,
  onReorder,
  widgetComponents,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id)
    }
  }

  // Filter out widgets that don't have components
  const orderedWidgets = useMemo(() => {
    return widgetOrder.filter((id) => widgetComponents[id])
  }, [widgetOrder, widgetComponents])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedWidgets}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          {orderedWidgets.map((widgetId) => {
            const widget = widgetComponents[widgetId]
            if (!widget) return null

            return (
              <DraggableWidget
                key={widgetId}
                id={widgetId}
                isEditMode={isEditMode}
                className={widget.className || ''}
              >
                {widget.component}
              </DraggableWidget>
            )
          })}
        </div>
      </SortableContext>
      <DragOverlay>
        {/* Overlay is handled by the transform on the actual item */}
      </DragOverlay>
    </DndContext>
  )
}
