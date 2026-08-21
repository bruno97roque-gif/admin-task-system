import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  IoBriefcaseOutline,
  IoCashOutline,
  IoCodeSlashOutline,
  IoLayersOutline,
  IoPeopleOutline,
  IoRefreshOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import type { AppUser, AuthUser, Project } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useProjectsByDisenoStore } from '../stores/projectsByDisenoStore'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import { getUsersByRoleName } from '../utils/assignableUsers'
import { isProjectAssignee } from '../utils/projectUsers'
import {
  estadoProyectoClass,
  getEstadoProyectoLabel,
  getEstadoProyectoOptions,
} from '../utils/projectStatus'
import { Button } from '../components/ui/Button'
import { DateInput } from '../components/ui/DateInput'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { toDateInputValue } from '../utils/date'

interface ProjectEditForm {
  comentario: string
  fechaEntrega: string
  estadoProyecto: string
}

type ProjectUsuarioItem = Project['usuarios'][number]

function extractUser(item: ProjectUsuarioItem): AppUser | null {
  if ('usuario' in item) return item.usuario ?? null
  if ('name' in item && 'id' in item) return item
  return null
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function authUserToAppUser(user: AuthUser): AppUser {
  return {
    id: user.id,
    name: user.name,
    user: user.user,
    roleId: user.roleId,
    active: true,
  }
}

function ProjectCard({
  project,
  columnUserId,
  onSelect,
}: {
  project: Project
  columnUserId: number
  onSelect?: (project: Project) => void
}) {
  const otrosUsuarios = project.usuarios
    .map(extractUser)
    .filter((u): u is AppUser => u !== null && u.id !== columnUserId)

  return (
    <article
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(project)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(project)
        }
      }}
      className={`rounded-lg border border-border bg-surface p-3 transition-colors ${
        onSelect
          ? 'cursor-pointer hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
          : ''
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">{project.name}</h3>
        <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-hover">
          Grupo {project.grupo}
        </span>
      </div>

      {project.descripcion && (
        <p className="mb-3 line-clamp-2 text-xs text-slate-400">{project.descripcion}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${estadoProyectoClass(project.estadoProyecto)}`}
        >
          {getEstadoProyectoLabel(project.estadoProyecto)}
        </span>
        {project.tecnologia && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-300">
            <IoCodeSlashOutline size={12} />
            {project.tecnologia}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
          <IoCashOutline size={12} />
          {project.estadoPago || '—'}
        </span>
      </div>

      <dl className="space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <IoLayersOutline size={12} className="text-slate-500" />
          <span>Seguimiento: {project.seguimiento?.name ?? '—'}</span>
        </div>
        {project.diasSinResponder !== null && (
          <div className="flex items-center gap-1.5">
            <IoTimeOutline size={12} className="text-slate-500" />
            <span>{project.diasSinResponder} días sin responder</span>
          </div>
        )}
      </dl>

      {project.comentario && (
        <p className="mt-3 border-t border-border pt-2 text-xs italic text-slate-500">
          “{project.comentario}”
        </p>
      )}

      {otrosUsuarios.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-2">
          <IoPeopleOutline size={12} className="text-slate-500" />
          <span className="text-xs text-slate-500">
            Con: {otrosUsuarios.map((u) => u.name).join(', ')}
          </span>
        </div>
      )}
    </article>
  )
}

function DisenadorColumn({
  disenador,
  projects,
  onSelectProject,
}: {
  disenador: AppUser
  projects: Project[]
  onSelectProject?: (project: Project) => void
}) {
  return (
    <section className="flex w-[min(100%,20rem)] shrink-0 flex-col rounded-xl border border-border bg-surface-raised sm:w-80">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
          {getInitials(disenador.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{disenador.name}</p>
          <p className="truncate text-xs text-slate-500">{disenador.user}</p>
        </div>
        <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-medium text-slate-300">
          {projects.length}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {projects.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            Sin proyectos asignados
          </p>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              columnUserId={disenador.id}
              onSelect={onSelectProject}
            />
          ))
        )}
      </div>
    </section>
  )
}

export function ProjectsByDisenoPage() {
  const authUser = useAuthStore((s) => s.user)
  const isDisenador = authUser?.roleName === 'Diseñador'
  const disenadorId = isDisenador ? authUser?.id : undefined
  const projects = useProjectsByDisenoStore((s) => s.projects)
  const loading = useProjectsByDisenoStore((s) => s.loading)
  const error = useProjectsByDisenoStore((s) => s.error)
  const saving = useProjectsByDisenoStore((s) => s.saving)
  const fetchProjects = useProjectsByDisenoStore((s) => s.fetchProjectsByDiseno)
  const updateProject = useProjectsByDisenoStore((s) => s.updateProject)

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setError,
  } = useForm<ProjectEditForm>({
    defaultValues: { comentario: '', fechaEntrega: '', estadoProyecto: '' },
  })

  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  useEffect(() => {
    fetchProjects(disenadorId)
    if (!isDisenador) {
      fetchUsers()
      fetchRoles()
    }
  }, [disenadorId, fetchProjects, fetchRoles, fetchUsers, isDisenador])

  const disenadores = useMemo(
    () => {
      if (isDisenador && authUser) return [authUserToAppUser(authUser)]

      const allDisenadores = getUsersByRoleName(users, roles, 'Diseñador')
      return allDisenadores
    },
    [authUser, isDisenador, roles, users],
  )

  const columns = useMemo(() => {
    if (disenadores.length === 0) return []

    return disenadores.map((disenador) => ({
      disenador,
      projects: projects.filter((project) =>
        isProjectAssignee(project, 'Diseñador', disenador.id),
      ),
    }))
  }, [disenadores, projects])

  const totalAsignados = useMemo(
    () => columns.reduce((acc, col) => acc + col.projects.length, 0),
    [columns],
  )

  const openEdit = (project: Project) => {
    setEditingProject(project)
    reset({
      comentario: project.comentario ?? '',
      fechaEntrega: toDateInputValue(project.fechaEntrega),
      estadoProyecto: project.estadoProyecto,
    })
  }

  const closeEdit = () => {
    setEditingProject(null)
    reset({ comentario: '', fechaEntrega: '', estadoProyecto: '' })
  }

  const onSubmit = async (data: ProjectEditForm) => {
    if (!editingProject) return

    const result = await updateProject(editingProject, {
      comentario: data.comentario,
      fechaEntrega: data.fechaEntrega.trim() || null,
      estadoProyecto: data.estadoProyecto,
    })
    if (result.success) {
      closeEdit()
    } else {
      setError('root', { message: result.error ?? 'Error al guardar el proyecto' })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            {isDisenador ? 'Mis proyectos' : 'Proyectos por Diseño'}
          </h1>
          <p className="text-sm text-slate-400">
            Vista canvas · {disenadores.length} diseñadores · {totalAsignados} asignaciones
          </p>
        </div>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => fetchProjects(disenadorId)}
          loading={loading}
        >
          <IoRefreshOutline size={18} />
          Actualizar
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {loading && columns.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Cargando proyectos...
          </div>
        ) : columns.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <IoBriefcaseOutline size={32} className="text-slate-600" />
            <p className="text-sm text-slate-500">
              No hay diseñadores cargados. Verificá que existan usuarios con rol “Diseñador”.
            </p>
          </div>
        ) : (
          <div className="flex h-full gap-4 overflow-x-auto pb-2">
            {columns.map(({ disenador, projects: colProjects }) => (
              <DisenadorColumn
                key={disenador.id}
                disenador={disenador}
                projects={colProjects}
                onSelectProject={openEdit}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={editingProject !== null}
        onClose={closeEdit}
        title={editingProject ? `Editar — ${editingProject.name}` : 'Editar proyecto'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}
          <Controller
            name="fechaEntrega"
            control={control}
            render={({ field }) => (
              <DateInput
                label="Fecha de entrega"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <Select
            label="Estado del proyecto"
            options={
              editingProject
                ? getEstadoProyectoOptions(
                    editingProject.estadoProyecto,
                    editingProject.tipoProyecto,
                  )
                : []
            }
            {...register('estadoProyecto')}
          />
          <Textarea
            label="Comentario"
            placeholder="Escribe un comentario..."
            rows={5}
            {...register('comentario')}
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
