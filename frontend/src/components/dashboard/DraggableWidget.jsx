import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export default function DraggableWidget({ id, children, isEditMode, className = '' }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isEditMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative
        ${isEditMode ? 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl' : ''}
        ${isDragging ? 'shadow-2xl' : ''}
        ${className}
      `}
    >
      {isEditMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700
                     cursor-grab active:cursor-grabbing hover:bg-gray-200 dark:hover:bg-gray-600
                     transition-colors shadow-sm"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
      )}
      {children}
    </div>
  )
}
