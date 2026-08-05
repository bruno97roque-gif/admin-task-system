import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  IoBriefcaseOutline,
  IoBookmarkOutline,
  IoCashOutline,
  IoCodeSlashOutline,
  IoLayersOutline,
  IoPeopleOutline,
  IoRefreshOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import type { AppUser, AuthUser, Project } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useProjectsByProgramadorStore } from '../stores/projectsByProgramadorStore'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import { getUsersByRoleName } from '../utils/assignableUsers'
import { getProjectUserIds } from '../utils/projectUsers'
import { Button } from '../components/ui/Button'
import { DateInput } from '../components/ui/DateInput'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'
import { formatDateDisplay, toDateInputValue } from '../utils/date'

interface ProjectEditForm {
  comentario: string
  fechaEntrega: string
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

const ESTADO_PROYECTO_COLORS: Record<string, string> = {
  Brief: 'bg-blue-500/20 text-blue-300',
  Taxonomia: 'bg-indigo-500/20 text-indigo-300',
  Diseno: 'bg-purple-500/20 text-purple-300',
  Desarollo: 'bg-amber-500/20 text-amber-300',
  ProyectoFinalizado: 'bg-emerald-500/20 text-emerald-300',
}

function estadoProyectoClass(estado: string): string {
  return ESTADO_PROYECTO_COLORS[estado] ?? 'bg-surface-overlay text-slate-300'
}

function ProjectCard({
  project,
  columnUserId,
  onSelect,
}: {
  project: Project
  columnUserId: number
  onSelect: (project: Project) => void
}) {
  const otrosUsuarios = project.usuarios
    .map(extractUser)
    .filter((u): u is AppUser => u !== null && u.id !== columnUserId)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(project)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(project)
        }
      }}
      className="cursor-pointer rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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

      {project.tipoProyecto && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-200">
            <IoBookmarkOutline size={13} className="text-violet-300" />
            {project.tipoProyecto}
          </span>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${estadoProyectoClass(project.estadoProyecto)}`}
        >
          {project.estadoProyecto}
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
        {project.fechaEntrega && (
          <div className="flex items-center gap-1.5">
            <IoTimeOutline size={12} className="text-slate-500" />
            <span>Entrega: {formatDateDisplay(project.fechaEntrega)}</span>
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

function ProgramadorColumn({
  programador,
  projects,
  onSelectProject,
}: {
  programador: AppUser
  projects: Project[]
  onSelectProject: (project: Project) => void
}) {
  return (
    <section className="flex w-80 shrink-0 flex-col rounded-xl border border-border bg-surface-raised">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent-hover">
          {getInitials(programador.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{programador.name}</p>
          <p className="truncate text-xs text-slate-500">{programador.user}</p>
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
              columnUserId={programador.id}
              onSelect={onSelectProject}
            />
          ))
        )}
      </div>
    </section>
  )
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

export function ProjectsByProgramadorPage() {
  const authUser = useAuthStore((s) => s.user)
  const isProgramador = authUser?.roleName === 'Programador'
  const programadorId = isProgramador ? authUser?.id : undefined

  const projects = useProjectsByProgramadorStore((s) => s.projects)
  const loading = useProjectsByProgramadorStore((s) => s.loading)
  const error = useProjectsByProgramadorStore((s) => s.error)
  const fetchProjects = useProjectsByProgramadorStore((s) => s.fetchProjectsByProgramador)
  const saving = useProjectsByProgramadorStore((s) => s.saving)
  const updateProjectComentario = useProjectsByProgramadorStore((s) => s.updateProjectComentario)

  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setError,
  } = useForm<ProjectEditForm>({ defaultValues: { comentario: '', fechaEntrega: '' } })

  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  useEffect(() => {
    fetchProjects(programadorId)
    if (!isProgramador) {
      fetchUsers()
      fetchRoles()
    }
  }, [fetchProjects, fetchUsers, fetchRoles, programadorId, isProgramador])

  const programadores = useMemo(() => {
    if (isProgramador && authUser) {
      return [authUserToAppUser(authUser)]
    }
    return getUsersByRoleName(users, roles, 'Programador')
  }, [authUser, isProgramador, users, roles])

  const columns = useMemo(() => {
    if (programadores.length === 0) return []

    return programadores.map((programador) => ({
      programador,
      projects: projects.filter((project) =>
        getProjectUserIds(project).includes(programador.id),
      ),
    }))
  }, [programadores, projects])

  const totalAsignados = useMemo(
    () => columns.reduce((acc, col) => acc + col.projects.length, 0),
    [columns],
  )

  const openEditComentario = (project: Project) => {
    setEditingProject(project)
    reset({
      comentario: project.comentario ?? '',
      fechaEntrega: toDateInputValue(project.fechaEntrega),
    })
  }

  const closeEditComentario = () => {
    setEditingProject(null)
    reset({ comentario: '', fechaEntrega: '' })
  }

  const onSubmitComentario = async (data: ProjectEditForm) => {
    if (!editingProject) return

    const result = await updateProjectComentario(editingProject, {
      comentario: data.comentario,
      fechaEntrega: data.fechaEntrega.trim() || null,
    })
    if (result.success) {
      closeEditComentario()
    } else {
      setError('root', { message: result.error ?? 'Error al guardar el comentario' })
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {isProgramador ? 'Mis proyectos' : 'Proyectos por Programador'}
          </h1>
          <p className="text-sm text-slate-400">
            Vista canvas · {programadores.length} programador
            {programadores.length !== 1 ? 'es' : ''} · {totalAsignados} asignaciones
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => fetchProjects(programadorId)}
          loading={loading}
        >
          <IoRefreshOutline size={18} />
          Actualizar
        </Button>
      </header>

      {error && editingProject === null && (
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
              No hay programadores cargados. Verificá que existan usuarios con rol
              “Programador”.
            </p>
          </div>
        ) : (
          <div className="flex h-full gap-4 overflow-x-auto pb-2">
            {columns.map(({ programador, projects: colProjects }) => (
              <ProgramadorColumn
                key={programador.id}
                programador={programador}
                projects={colProjects}
                onSelectProject={openEditComentario}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={editingProject !== null}
        onClose={closeEditComentario}
        title={editingProject ? `Editar — ${editingProject.name}` : 'Editar proyecto'}
      >
        <form onSubmit={handleSubmit(onSubmitComentario)} className="space-y-4">
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
          <Textarea
            label="Comentario"
            placeholder="Escribe un comentario..."
            rows={5}
            {...register('comentario')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeEditComentario}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
