import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  IoArrowUndoOutline,
  IoBriefcaseOutline,
  IoLayersOutline,
  IoRefreshOutline,
} from 'react-icons/io5'
import type { Project } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useProjectsByDisenoStore } from '../stores/projectsByDisenoStore'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import { getUsersByRoleName } from '../utils/assignableUsers'
import { isProjectAssignee } from '../utils/projectUsers'
import { getEstadoProyectoOptions } from '../utils/projectStatus'
import { type OrderMode } from '../utils/projectOrder'
import { authUserToAppUser } from '../utils/user'
import { Button } from '../components/ui/Button'
import { DateInput } from '../components/ui/DateInput'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { ProjectColumn } from '../components/projects/ProjectColumn'
import { ProjectDetails } from '../components/projects/ProjectDetails'
import { ProjectFilters } from '../components/projects/ProjectFilters'
import { ProjectsBycModal } from '../components/projects/ProjectsBycModal'
import { LoaderBlock } from '../components/ui/Loader'
import { CornerRestGif } from '../components/ui/CornerRestGif'
import { toDateInputValue } from '../utils/date'

interface ProjectEditForm {
  comentario: string
  fechaEntrega: string
  estadoProyecto: string
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
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [ordenFiltro, setOrdenFiltro] = useState<OrderMode>('personalizado')
  const [showBycModal, setShowBycModal] = useState(false)
  const [resetKey, setResetKey] = useState(0)
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

  const filteredProjects = useMemo(
    () => projects.filter((project) => !estadoFiltro || project.estadoProyecto === estadoFiltro),
    [projects, estadoFiltro],
  )

  const columns = useMemo(() => {
    if (disenadores.length === 0) return []

    return disenadores.map((disenador) => ({
      disenador,
      projects: filteredProjects.filter((project) =>
        isProjectAssignee(project, 'Diseñador', disenador.id),
      ),
    }))
  }, [disenadores, filteredProjects])

  const totalAsignados = useMemo(
    () => columns.reduce((acc, col) => acc + col.projects.length, 0),
    [columns],
  )

  const handleResetOrder = () => setResetKey((k) => k + 1)

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
            {isDisenador ? 'Mis proyectos' : 'Diseñadores'}
          </h1>
          <p className="text-sm text-slate-400">
            Vista canvas · {disenadores.length} diseñadores · {totalAsignados} asignaciones
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isDisenador && (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setShowBycModal(true)}
            >
              <IoLayersOutline size={18} />
              Ver proyectos B y C
            </Button>
          )}
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchProjects(disenadorId)}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <ProjectFilters
          estado={estadoFiltro}
          onEstadoChange={setEstadoFiltro}
          orden={ordenFiltro}
          onOrdenChange={setOrdenFiltro}
        />
        <Button variant="ghost" onClick={handleResetOrder}>
          <IoArrowUndoOutline size={16} />
          Restablecer orden
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {loading && columns.length === 0 ? (
          <LoaderBlock label="Cargando proyectos..." />
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
              <ProjectColumn
                key={disenador.id}
                user={disenador}
                projects={colProjects}
                onSelectProject={openEdit}
                avatarClassName="bg-purple-500/20 text-purple-300"
                orderStorageKey={`diseno-${disenador.id}`}
                orderMode={ordenFiltro}
                resetSignal={resetKey}
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
          {editingProject && <ProjectDetails project={editingProject} />}
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

      {isDisenador && disenadorId !== undefined && (
        <ProjectsBycModal
          open={showBycModal}
          onClose={() => setShowBycModal(false)}
          roleName="Diseñador"
          userId={disenadorId}
        />
      )}

      <CornerRestGif />
    </div>
  )
}
