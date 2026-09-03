import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { AppUser, Project } from '../../types'
import {
  clearStoredOrder,
  getStoredOrder,
  mergeVisibleOrder,
  reconcileOrder,
  setStoredOrder,
  sortByOrder,
  sortProjectsByMode,
  type OrderMode,
} from '../../utils/projectOrder'
import { sortPorJerarquia } from '../../utils/projectStatus'
import { Avatar } from '../ui/Avatar'
import { ProjectCard } from './ProjectCard'
import { SortableProjectCard } from './SortableProjectCard'

/** La columna es una lista vertical: no tiene sentido arrastrar a los costados. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
})

export function ProjectColumn({
  user,
  projects,
  onSelectProject,
  avatarClassName = 'bg-accent/20 text-accent-hover',
  orderStorageKey,
  orderMode = 'personalizado',
  resetSignal = 0,
}: {
  user: AppUser
  projects: Project[]
  onSelectProject?: (project: Project) => void
  avatarClassName?: string
  orderStorageKey: string
  orderMode?: OrderMode
  /** Al cambiar (ej. resetSignal + 1), borra el orden guardado y vuelve a la
   * jerarquía — sin desmontar, así dnd-kit anima el reacomodo como un drag. */
  resetSignal?: number
}) {
  const [order, setOrder] = useState<number[]>(() => getStoredOrder(orderStorageKey))
  const isCustomOrder = orderMode === 'personalizado'

  // Posiciones "antes" del reset, para animarlas a mano (FLIP): fuera de un
  // drag real, dnd-kit no anima solo porque el array cambió de orden.
  const cardRefs = useRef(new Map<number, HTMLDivElement>())
  const pendingFlip = useRef<Map<number, DOMRect> | null>(null)

  const skipFirstReset = useRef(true)
  useEffect(() => {
    if (skipFirstReset.current) {
      skipFirstReset.current = false
      return
    }
    const before = new Map<number, DOMRect>()
    cardRefs.current.forEach((el, id) => before.set(id, el.getBoundingClientRect()))
    pendingFlip.current = before

    clearStoredOrder(orderStorageKey)
    setOrder([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal])

  const orderedProjects = useMemo(() => {
    // Base por jerarquía de etapa: así, mientras nadie arrastró nada
    // (o cuando aparece una tarjeta nueva), el orden por defecto tiene
    // sentido en vez de ser el orden crudo en que llegó de la API.
    const base = sortPorJerarquia(projects)
    if (!isCustomOrder) return sortProjectsByMode(base, orderMode)
    return sortByOrder(base, reconcileOrder(order, base.map((p) => p.id)))
  }, [projects, order, orderMode, isCustomOrder])

  useLayoutEffect(() => {
    const before = pendingFlip.current
    if (!before) return
    pendingFlip.current = null

    cardRefs.current.forEach((el, id) => {
      const prevRect = before.get(id)
      if (!prevRect) return
      const deltaY = prevRect.top - el.getBoundingClientRect().top
      if (Math.abs(deltaY) < 1) return

      el.style.transition = 'none'
      el.style.transform = `translateY(${deltaY}px)`
      el.getBoundingClientRect() // fuerza reflow antes de animar
      requestAnimationFrame(() => {
        el.style.transition = 'transform 300ms ease'
        el.style.transform = ''
      })
    })
  }, [orderedProjects])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const visibleIds = orderedProjects.map((p) => p.id)
    const oldIndex = visibleIds.indexOf(Number(active.id))
    const newIndex = visibleIds.indexOf(Number(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const newVisibleIds = arrayMove(visibleIds, oldIndex, newIndex)
    const fullOrder = reconcileOrder(order, projects.map((p) => p.id))
    const newOrder = mergeVisibleOrder(fullOrder, visibleIds, newVisibleIds)
    setOrder(newOrder)
    setStoredOrder(orderStorageKey, newOrder)
  }

  return (
    <section className="flex w-[min(100%,20rem)] shrink-0 flex-col rounded-xl border border-border bg-surface-raised sm:w-80">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <Avatar userId={user.id} name={user.name} size={40} fallbackClassName={avatarClassName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.user}</p>
        </div>
        <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-medium text-slate-300">
          {projects.length}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {orderedProjects.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            Sin proyectos asignados
          </p>
        ) : !isCustomOrder ? (
          orderedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              columnUserId={user.id}
              onSelect={onSelectProject}
            />
          ))
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={orderedProjects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedProjects.map((project) => (
                <div
                  key={project.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(project.id, el)
                    else cardRefs.current.delete(project.id)
                  }}
                >
                  <SortableProjectCard
                    project={project}
                    columnUserId={user.id}
                    onSelect={onSelectProject}
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  )
}
