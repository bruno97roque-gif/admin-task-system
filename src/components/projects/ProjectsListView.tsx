import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { IoAddOutline, IoCreateOutline, IoFolderOpenOutline, IoRefreshOutline } from 'react-icons/io5'
import type { Project } from '../../types'
import type { CreateProjectRequest, UpdateProjectRequest } from '../../services/api'
import { useRolesStore } from '../../stores/rolesStore'
import { useSeguimientosStore } from '../../stores/seguimientosStore'
import { useUsersStore } from '../../stores/usersStore'
import {
  getUsersByRoleName,
  mergeUserIds,
  splitUserIdsByRole,
  toSelectOptions,
} from '../../utils/assignableUsers'
import { getProjectUserIds, getProjectUserNames } from '../../utils/projectUsers'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { SearchableMultiSelect } from '../ui/SearchableMultiSelect'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

const DEFAULT_GRUPO_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

const ESTADO_PROYECTO_OPTIONS = [
  { value: 'Brief', label: 'Brief' },
  { value: 'Taxonomia', label: 'Taxonomia' },
  { value: 'Diseno', label: 'Diseno' },
  { value: 'Desarollo', label: 'Desarollo' },
  { value: 'ProyectoFinalizado', label: 'ProyectoFinalizado' },
]

const TECNOLOGIA_OPTIONS = [
  { value: 'Shopify', label: 'Shopify' },
  { value: 'WordPress', label: 'WordPress' },
  { value: 'Personalizado', label: 'Personalizado' },
]

interface ProjectForm {
  name: string
  descripcion: string
  grupo: string
  seguimientoId: string
  comentario: string
  tecnologia: string
  estadoPago: string
  estadoProyecto: string
  diasSinResponder: string
  programadoresIds: string[]
  disenadoresIds: string[]
}

const emptyForm: ProjectForm = {
  name: '',
  descripcion: '',
  grupo: '',
  seguimientoId: '',
  comentario: '',
  tecnologia: '',
  estadoPago: '',
  estadoProyecto: '',
  diasSinResponder: '',
  programadoresIds: [],
  disenadoresIds: [],
}

interface ProjectsListViewProps {
  title: string
  description: string
  grupoOptions?: { value: string; label: string }[]
  projects: Project[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (data: CreateProjectRequest) => Promise<{ success: boolean; error?: string }>
  updateProject: (
    id: number,
    data: UpdateProjectRequest,
    usuariosIds: number[],
  ) => Promise<{ success: boolean; error?: string }>
}

export function ProjectsListView({
  title,
  description,
  grupoOptions = DEFAULT_GRUPO_OPTIONS,
  projects,
  loading,
  saving,
  error,
  fetchProjects,
  createProject,
  updateProject,
}: ProjectsListViewProps) {
  const seguimientos = useSeguimientosStore((s) => s.seguimientos)
  const fetchSeguimientos = useSeguimientosStore((s) => s.fetchSeguimientos)

  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)

  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [grupoFilter, setGrupoFilter] = useState('')
  const [estadoProyectoFilter, setEstadoProyectoFilter] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setError,
  } = useForm<ProjectForm>({ defaultValues: emptyForm })

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const seguimientoOptions = seguimientos.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  const programadorOptions = useMemo(
    () => toSelectOptions(getUsersByRoleName(users, roles, 'Programador')),
    [users, roles],
  )

  const disenadorOptions = useMemo(
    () => toSelectOptions(getUsersByRoleName(users, roles, 'Diseñador')),
    [users, roles],
  )

  const hasActiveFilters =
    searchQuery.trim() !== '' || grupoFilter !== '' || estadoProyectoFilter !== ''

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return projects.filter((project) => {
      if (grupoFilter && project.grupo !== grupoFilter) return false
      if (estadoProyectoFilter && project.estadoProyecto !== estadoProyectoFilter) {
        return false
      }
      if (!query) return true

      const haystack = [
        project.name,
        project.descripcion,
        getProjectUserNames(project),
        String(project.id),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [projects, searchQuery, grupoFilter, estadoProyectoFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setGrupoFilter('')
    setEstadoProyectoFilter('')
  }

  const loadFormData = () =>
    Promise.all([fetchSeguimientos(), fetchUsers(), fetchRoles()])

  const openCreate = async () => {
    setEditingProject(null)
    reset(emptyForm)
    await loadFormData()
    setModalOpen(true)
  }

  const openEdit = async (project: Project) => {
    setEditingProject(project)
    await loadFormData()
    const currentRoles = useRolesStore.getState().roles
    const currentUsers = useUsersStore.getState().users
    const { programadoresIds, disenadoresIds } = splitUserIdsByRole(
      getProjectUserIds(project),
      currentRoles,
      currentUsers,
    )
    reset({
      name: project.name,
      descripcion: project.descripcion,
      grupo: project.grupo,
      seguimientoId: String(project.seguimientoId),
      comentario: project.comentario ?? '',
      tecnologia: project.tecnologia ?? '',
      estadoPago: project.estadoPago ?? '',
      estadoProyecto: project.estadoProyecto ?? '',
      diasSinResponder:
        project.diasSinResponder !== null ? String(project.diasSinResponder) : '',
      programadoresIds,
      disenadoresIds,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProject(null)
    reset(emptyForm)
  }

  const buildCreatePayload = (data: ProjectForm) => ({
    name: data.name.trim(),
    descripcion: data.descripcion.trim(),
    grupo: data.grupo,
    seguimientoId: Number(data.seguimientoId),
    comentario: data.comentario.trim(),
  })

  const buildUpdatePayload = (data: ProjectForm) => ({
    ...buildCreatePayload(data),
    tecnologia: data.tecnologia.trim() || null,
    estadoPago: data.estadoPago.trim(),
    estadoProyecto: data.estadoProyecto.trim(),
    diasSinResponder: data.diasSinResponder.trim()
      ? Number(data.diasSinResponder)
      : null,
  })

  const getUsuariosIds = (data: ProjectForm) =>
    mergeUserIds(data.programadoresIds, data.disenadoresIds)

  const onSubmit = async (data: ProjectForm) => {
    const usuariosIds = getUsuariosIds(data)

    const result = editingProject
      ? await updateProject(editingProject.id, buildUpdatePayload(data), usuariosIds)
      : await createProject({ ...buildCreatePayload(data), usuariosIds })

    if (result.success) {
      closeModal()
    } else {
      setError('root', {
        message: result.error ?? 'Error al guardar el proyecto',
      })
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fetchProjects()} loading={loading}>
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button onClick={openCreate}>
            <IoAddOutline size={18} />
            Agregar proyecto
          </Button>
        </div>
      </header>

      {error && !modalOpen && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] flex-1">
          <Input
            label="Buscar"
            placeholder="Nombre, descripción, usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-36">
          <Select
            label="Grupo"
            options={grupoOptions}
            placeholder="Todos"
            value={grupoFilter}
            onChange={(e) => setGrupoFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Estado proyecto"
            options={ESTADO_PROYECTO_OPTIONS}
            placeholder="Todos"
            value={estadoProyectoFilter}
            onChange={(e) => setEstadoProyectoFilter(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {hasActiveFilters && projects.length > 0 && (
        <p className="mb-4 text-sm text-slate-400">
          Mostrando {filteredProjects.length} de {projects.length} proyectos
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
        <table className="w-full min-w-[1024px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Estado pago</th>
              <th className="px-4 py-3 font-medium">Estado proyecto</th>
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Seguimiento</th>
              <th className="px-4 py-3 font-medium">Tecnología</th>
              <th className="px-4 py-3 font-medium">Usuarios</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Cargando proyectos...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No hay proyectos registrados
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No hay proyectos que coincidan con los filtros
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 text-slate-400">{project.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <IoFolderOpenOutline className="shrink-0 text-accent" size={16} />
                      {project.name}
                    </div>
                    <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                      {project.descripcion}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{project.estadoPago}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent-hover">
                      {project.estadoProyecto}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{project.grupo}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {project.seguimiento?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {project.tecnologia ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {getProjectUserNames(project)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => openEdit(project)}
                        aria-label="Editar"
                      >
                        <IoCreateOutline size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingProject ? 'Editar proyecto' : 'Agregar proyecto'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}

          <Input
            label="Nombre"
            placeholder="Ej. Youbi"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })}
          />

          <Textarea
            label="Descripción"
            placeholder="Describe el proyecto..."
            error={errors.descripcion?.message}
            {...register('descripcion', { required: 'La descripción es obligatoria' })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Grupo"
              options={grupoOptions}
              placeholder="Selecciona un grupo"
              error={errors.grupo?.message}
              {...register('grupo', { required: 'Selecciona un grupo' })}
            />

            <Select
              label="Seguimiento"
              options={seguimientoOptions}
              placeholder="Selecciona un seguimiento"
              error={errors.seguimientoId?.message}
              {...register('seguimientoId', { required: 'Selecciona un seguimiento' })}
            />
          </div>

          {editingProject && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Estado pago"
                  placeholder="Ej. 50%, Pagado, Pendiente..."
                  {...register('estadoPago')}
                />
                <Select
                  label="Estado proyecto"
                  options={ESTADO_PROYECTO_OPTIONS}
                  placeholder="Selecciona un estado"
                  error={errors.estadoProyecto?.message}
                  {...register('estadoProyecto')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Tecnología"
                  options={TECNOLOGIA_OPTIONS}
                  placeholder="Selecciona una tecnología"
                  error={errors.tecnologia?.message}
                  {...register('tecnologia')}
                />
                <Input
                  label="Días sin responder"
                  type="number"
                  min={0}
                  placeholder="Ej. 3"
                  {...register('diasSinResponder')}
                />
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="programadoresIds"
              control={control}
              render={({ field }) => (
                <SearchableMultiSelect
                  label="Programadores"
                  options={programadorOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Buscar programador..."
                  emptyMessage="No hay programadores disponibles"
                />
              )}
            />

            <Controller
              name="disenadoresIds"
              control={control}
              render={({ field }) => (
                <SearchableMultiSelect
                  label="Diseñadores"
                  options={disenadorOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Buscar diseñador..."
                  emptyMessage="No hay diseñadores disponibles"
                />
              )}
            />
          </div>

          <Textarea
            label="Comentario"
            placeholder="Comentario opcional..."
            {...register('comentario')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingProject ? 'Guardar cambios' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
