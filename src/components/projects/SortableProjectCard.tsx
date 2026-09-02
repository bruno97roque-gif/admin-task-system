import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project } from '../../types'
import { ProjectCard } from './ProjectCard'

export function SortableProjectCard({
  project,
  columnUserId,
  onSelect,
}: {
  project: Project
  columnUserId: number
  onSelect?: (project: Project) => void
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      role={undefined}
      tabIndex={undefined}
      aria-roledescription={undefined}
    >
      <ProjectCard project={project} columnUserId={columnUserId} onSelect={onSelect} />
    </div>
  )
}
