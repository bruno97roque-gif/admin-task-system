import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import {
  IoAddOutline,
  IoCreateOutline,
  IoFolderOpenOutline,
  IoRefreshOutline,
  IoTimeOutline,
  IoTrashOutline,
} from 'react-icons/io5'
import type { Project } from '../../types'
import type { CreateProjectRequest, UpdateProjectRequest } from '../../services/api'
import { useRolesStore } from '../../stores/rolesStore'
import { useSeguimientosStore } from '../../stores/seguimientosStore'
import { useUsersStore } from '../../stores/usersStore'
import { getUsersByRoleName, toSelectOptions } from '../../utils/assignableUsers'
import { getProjectUserNames } from '../../utils/projectUsers'
import { projectMatchesSearch } from '../../utils/projectSearch'
import { getTipoProyectoLabel, TIPO_PROYECTO_OPTIONS } from '../../utils/projectType'
import { ESTADO_PROYECTO_OPTIONS, getEstadoProyectoLabel } from '../../utils/projectStatus'
import { Button } from '../ui/Button'
import { ProjectSearchInput } from './ProjectSearchInput'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { ProjectHistorialModal } from './ProjectHistorialModal'
import { ProjectEditModal } from './ProjectEditModal'

const DEFAULT_GRUPO_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

const ORDEN_OPTIONS = [
  { value: 'defecto', label: 'Por defecto' },
  { value: 'antiguo', label: 'Más antiguo' },
  { value: 'nuevo', label: 'Más nuevo' },
  { value: 'alfabetico', label: 'Alfabético' },
]

type OrdenProyectos = (typeof ORDEN_OPTIONS)[number]['value']

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
  updateProjectResponsables: (
    id: number,
    data: { disenadorId: number; desarrolladorId: number },
  ) => Promise<{ success: boolean; error?: string }>
  deleteProject?: (id: number) => Promise<{ success: boolean; error?: string }>
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
  updateProjectResponsables,
  deleteProject,
}: ProjectsListViewProps) {
  const seguimientos = useSeguimientosStore((s) => s.seguimientos)
  const fetchSeguimientos = useSeguimientosStore((s) => s.fetchSeguimientos)

  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)

  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [grupoFilter, setGrupoFilter] = useState('')
  const [estadoProyectoFilter, setEstadoProyectoFilter] = useState('')
  const [orden, setOrden] = useState<OrdenProyectos>('defecto')
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [historialProject, setHistorialProject] = useState<Project | null>(null)

  const {
    register,
    handleSubmit,
    reset,
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
    searchQuery.trim() !== '' ||
    grupoFilter !== '' ||
    estadoProyectoFilter !== '' ||
    orden !== 'defecto'

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      if (grupoFilter && project.grupo !== grupoFilter) return false
      if (estadoProyectoFilter && project.estadoProyecto !== estadoProyectoFilter) {
        return false
      }
      return projectMatchesSearch(project, searchQuery, showTipoProyecto)
    })

    if (orden === 'defecto') return filtered

    const sorted = [...filtered]
    if (orden === 'antiguo') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (orden === 'nuevo') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (orden === 'alfabetico') {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    }
    return sorted
  }, [projects, searchQuery, grupoFilter, estadoProyectoFilter, showTipoProyecto, orden])

  const clearFilters = () => {
    setSearchQuery('')
    setGrupoFilter('')
    setEstadoProyectoFilter('')
    setOrden('defecto')
  }

  const openCreate = async () => {
    reset(emptyForm)
    await Promise.all([fetchSeguimientos(), fetchUsers(), fetchRoles()])
    setCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setCreateModalOpen(false)
    reset(emptyForm)
  }

  const openDeleteConfirmation = (project: Project) => {
    setProjectToDelete(project)
    setDeleteConfirmationOpen(true)
  }

  const cancelDelete = () => {
    if (saving) return
    setProjectToDelete(null)
    setDeleteConfirmationOpen(false)
    setDeleteModalOpen(false)
    setDeleteName('')
  }

  const continueDelete = () => {
    if (!projectToDelete) return
    setDeleteConfirmationOpen(false)
    setDeleteName('')
    setDeleteModalOpen(true)
  }

  const confirmDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!deleteProject || !projectToDelete || deleteName.trim() !== projectToDelete.name) return

    const result = await deleteProject(projectToDelete.id)
    if (result.success) {
      cancelDelete()
    }
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

  const onSubmit = async (data: ProjectForm) => {
    const result = await createProject(buildCreatePayload(data))

    if (result.success) {
      closeCreateModal()
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

      {error && !createModalOpen && !editingProject && (
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
        <div className="w-full sm:w-44">
          <Select
            label="Ordenar por"
            options={ORDEN_OPTIONS}
            value={orden}
            onChange={(e) => setOrden(e.target.value as OrdenProyectos)}
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
                        onClick={() => setHistorialProject(project)}
                        aria-label={`Ver historial de ${project.name}`}
                      >
                        <IoTimeOutline size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setEditingProject(project)}
                        aria-label="Editar"
                      >
                        <IoCreateOutline size={16} />
                      </Button>
                      {deleteProject && (
                        <Button
                          variant="ghost"
                          onClick={() => openDeleteConfirmation(project)}
                          aria-label={`Eliminar ${project.name}`}
                          className="text-red-400 hover:text-red-300"
                        >
                          <IoTrashOutline size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={createModalOpen} onClose={closeCreateModal} title="Agregar proyecto" size="lg">
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
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={closeCreateModal}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <ProjectEditModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
        saving={saving}
        showTipoProyecto={showTipoProyecto}
        grupoOptions={grupoOptions}
        updateProject={updateProject}
        updateProjectResponsables={updateProjectResponsables}
      />

      <ConfirmDialog
        open={deleteConfirmationOpen}
        title="Eliminar proyecto"
        message="¿Seguro que quieres eliminar este proyecto?"
        onConfirm={continueDelete}
        onCancel={cancelDelete}
      />

      <Modal
        open={deleteModalOpen}
        onClose={cancelDelete}
        title="Confirmar eliminación"
        size="sm"
      >
        <form onSubmit={confirmDelete} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <p className="text-sm text-slate-300">
            Escribe <strong className="text-slate-100">{projectToDelete?.name}</strong> para confirmar.
          </p>
          <Input
            label="Nombre del proyecto"
            value={deleteName}
            onChange={(event) => setDeleteName(event.target.value)}
            autoFocus
            autoComplete="off"
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={cancelDelete}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="w-full sm:w-auto"
              loading={saving}
              disabled={deleteName.trim() !== projectToDelete?.name}
            >
              Eliminar proyecto
            </Button>
          </div>
        </form>
      </Modal>

      <ProjectHistorialModal
        key={historialProject?.id ?? 'none'}
        project={historialProject}
        onClose={() => setHistorialProject(null)}
      />
    </div>
  )
}
