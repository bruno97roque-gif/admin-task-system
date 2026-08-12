import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { IoAddOutline, IoCreateOutline, IoFolderOpenOutline, IoRefreshOutline } from 'react-icons/io5'
import type { Project } from '../../types'
import type { CreateProjectRequest, UpdateProjectRequest } from '../../services/api'
import { useRolesStore } from '../../stores/rolesStore'
import { useSeguimientosStore } from '../../stores/seguimientosStore'
import { useUsersStore } from '../../stores/usersStore'
import { getUsersByRoleName, toSelectOptions } from '../../utils/assignableUsers'
import { getProjectUserNames } from '../../utils/projectUsers'
import { projectMatchesSearch } from '../../utils/projectSearch'
import { getTipoProyectoLabel, TIPO_PROYECTO_OPTIONS } from '../../utils/projectType'
import {
  ESTADO_PROYECTO_OPTIONS,
  getEstadoProyectoLabel,
  getEstadoProyectoOptions,
} from '../../utils/projectStatus'
import { toDateInputValue } from '../../utils/date'
import { Button } from '../ui/Button'
import { ProjectSearchInput } from './ProjectSearchInput'
import { Input } from '../ui/Input'
import { DateInput } from '../ui/DateInput'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

const DEFAULT_GRUPO_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

const TECNOLOGIA_OPTIONS = [
  { value: 'Shopify', label: 'Shopify' },
  { value: 'WordPress', label: 'WordPress' },
  { value: 'Personalizado', label: 'Personalizado' },
]

interface ProjectForm {
  name: string
  descripcion: string
  tipoProyecto: string
  grupo: string
  seguimientoId: string
  comentario: string
  tecnologia: string
  estadoPago: string
  estadoProyecto: string
  diasSinResponder: string
  fechaEntrega: string
  programadorId: string
  disenadorId: string
}

const emptyForm: ProjectForm = {
  name: '',
  descripcion: '',
  tipoProyecto: '',
  grupo: '',
  seguimientoId: '',
  comentario: '',
  tecnologia: '',
  estadoPago: '',
  estadoProyecto: '',
  diasSinResponder: '',
  fechaEntrega: '',
  programadorId: '',
  disenadorId: '',
}

interface ProjectsListViewProps {
  title: string
  description: string
  grupoOptions?: { value: string; label: string }[]
  showTipoProyecto?: boolean
  projects: Project[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (data: CreateProjectRequest) => Promise<{ success: boolean; error?: string }>
  updateProject: (
    id: number,
    data: UpdateProjectRequest,
  ) => Promise<{ success: boolean; error?: string }>
}

export function ProjectsListView({
  title,
  description,
  grupoOptions = DEFAULT_GRUPO_OPTIONS,
  showTipoProyecto = true,
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
    return projects.filter((project) => {
      if (grupoFilter && project.grupo !== grupoFilter) return false
      if (estadoProyectoFilter && project.estadoProyecto !== estadoProyectoFilter) {
        return false
      }
      return projectMatchesSearch(project, searchQuery, showTipoProyecto)
    })
  }, [projects, searchQuery, grupoFilter, estadoProyectoFilter, showTipoProyecto])

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
    reset({
      name: project.name,
      descripcion: project.descripcion,
      tipoProyecto: project.tipoProyecto ?? '',
      grupo: project.grupo,
      seguimientoId: String(project.seguimientoId),
      comentario: project.comentario ?? '',
      tecnologia: project.tecnologia ?? '',
      estadoPago: project.estadoPago ?? '',
      estadoProyecto:
        project.estadoProyecto === 'Desarollo'
          ? 'Desarrollo'
          : (project.estadoProyecto ?? ''),
      diasSinResponder:
        project.diasSinResponder !== null ? String(project.diasSinResponder) : '',
      fechaEntrega: toDateInputValue(project.fechaEntrega),
      programadorId: project.desarrolladorId != null ? String(project.desarrolladorId) : '',
      disenadorId: project.disenadorId != null ? String(project.disenadorId) : '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProject(null)
    reset(emptyForm)
  }

  const buildCreatePayload = (data: ProjectForm): CreateProjectRequest => {
    const desarrolladorId = data.programadorId ? Number(data.programadorId) : undefined
    const disenadorId = data.disenadorId ? Number(data.disenadorId) : undefined

    return {
      name: data.name.trim(),
      descripcion: data.descripcion.trim(),
      grupo: data.grupo,
      seguimientoId: Number(data.seguimientoId),
      comentario: data.comentario.trim(),
      ...(showTipoProyecto && {
        tipoProyecto: data.tipoProyecto.trim() || null,
      }),
      ...(desarrolladorId != null && { desarrolladorId }),
      ...(disenadorId != null && { disenadorId }),
    }
  }

  const buildUpdatePayload = (data: ProjectForm): UpdateProjectRequest => ({
    ...buildCreatePayload(data),
    tipoProyecto: showTipoProyecto
      ? data.tipoProyecto.trim() || null
      : (editingProject?.tipoProyecto ?? null),
    tecnologia: data.tecnologia.trim() || null,
    estadoPago: data.estadoPago.trim(),
    estadoProyecto: data.estadoProyecto.trim(),
    diasSinResponder: data.diasSinResponder.trim()
      ? Number(data.diasSinResponder)
      : null,
    fechaEntrega: data.fechaEntrega.trim() || null,
    desarrolladorId: data.programadorId ? Number(data.programadorId) : null,
    disenadorId: data.disenadorId ? Number(data.disenadorId) : null,
  })

  const onSubmit = async (data: ProjectForm) => {
    const result = editingProject
      ? await updateProject(editingProject.id, buildUpdatePayload(data))
      : await createProject(buildCreatePayload(data))

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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">{title}</h1>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchProjects()}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate}>
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
          <ProjectSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            projects={projects}
            showTipoProyecto={showTipoProyecto}
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
              {showTipoProyecto && (
                <th className="px-4 py-3 font-medium">Tipo proyecto</th>
              )}
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
                <td colSpan={showTipoProyecto ? 10 : 9} className="px-4 py-8 text-center text-slate-500">
                  Cargando proyectos...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={showTipoProyecto ? 10 : 9} className="px-4 py-8 text-center text-slate-500">
                  No hay proyectos registrados
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={showTipoProyecto ? 10 : 9} className="px-4 py-8 text-center text-slate-500">
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
                  {showTipoProyecto && (
                    <td className="px-4 py-3">
                      {project.tipoProyecto ? (
                        <span className="inline-flex rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-300 ring-1 ring-violet-500/25">
                          {getTipoProyectoLabel(project.tipoProyecto)}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-400">{project.estadoPago}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent-hover">
                      {getEstadoProyectoLabel(project.estadoProyecto)}
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

          {showTipoProyecto && (
            <Select
              label="Tipo Proyecto"
              options={TIPO_PROYECTO_OPTIONS}
              placeholder="Selecciona un tipo"
              error={errors.tipoProyecto?.message}
              {...register('tipoProyecto')}
            />
          )}

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
                  options={getEstadoProyectoOptions(
                    editingProject?.estadoProyecto ?? '',
                    editingProject?.tipoProyecto ?? null,
                  )}
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
            <Select
              label="Programador"
              options={programadorOptions}
              placeholder="Sin asignar"
              {...register('programadorId')}
            />

            <Select
              label="Diseñador"
              options={disenadorOptions}
              placeholder="Sin asignar"
              {...register('disenadorId')}
            />
          </div>

          <Textarea
            label="Comentario"
            placeholder="Comentario opcional..."
            {...register('comentario')}
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving}>
              {editingProject ? 'Guardar cambios' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
