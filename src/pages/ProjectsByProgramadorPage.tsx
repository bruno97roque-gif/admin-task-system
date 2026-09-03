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
import { useProjectsByProgramadorStore } from '../stores/projectsByProgramadorStore'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import { getUsersByRoleName } from '../utils/assignableUsers'
import { isProjectAssignee } from '../utils/projectUsers'
import { ESTADO_PROYECTO_OPTIONS, getEstadoProyectoOptions } from '../utils/projectStatus'
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

// Este tablero es solo del desarrollo: nada de las etapas de diseño ni de
// Proyecto Finalizado (que tiene su propia ventana, "Finalizados").
const ETAPAS_DEVELOPERS = ['Desarrollo', 'Brief', 'DesarrolloFinalizado']
const ESTADO_OPTIONS_DEVELOPERS = ESTADO_PROYECTO_OPTIONS.filter((opt) =>
  ETAPAS_DEVELOPERS.includes(opt.value),
)

interface ProjectEditForm {
  comentario: string
  fechaEntrega: string
  estadoProyecto: string
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

  const filteredProjects = useMemo(
    () =>
      projects
        .filter((project) => ETAPAS_DEVELOPERS.includes(project.estadoProyecto))
        .filter((project) => !estadoFiltro || project.estadoProyecto === estadoFiltro),
    [projects, estadoFiltro],
  )

  const columns = useMemo(() => {
    if (programadores.length === 0) return []

    return programadores.map((programador) => ({
      programador,
      projects: filteredProjects.filter((project) =>
        isProjectAssignee(project, 'Programador', programador.id),
      ),
    }))
  }, [programadores, filteredProjects])

  const totalAsignados = useMemo(
    () => columns.reduce((acc, col) => acc + col.projects.length, 0),
    [columns],
  )

  const handleResetOrder = () => setResetKey((k) => k + 1)

  const openEditComentario = (project: Project) => {
    setEditingProject(project)
    reset({
      comentario: project.comentario ?? '',
      fechaEntrega: toDateInputValue(project.fechaEntrega),
      estadoProyecto: project.estadoProyecto,
    })
  }

  const closeEditComentario = () => {
    setEditingProject(null)
    reset({ comentario: '', fechaEntrega: '', estadoProyecto: '' })
  }

  const onSubmitComentario = async (data: ProjectEditForm) => {
    if (!editingProject) return

    const result = await updateProjectComentario(editingProject, {
      comentario: data.comentario,
      fechaEntrega: data.fechaEntrega.trim() || null,
      estadoProyecto: data.estadoProyecto,
    })
    if (result.success) {
      closeEditComentario()
    } else {
      setError('root', { message: result.error ?? 'Error al guardar el proyecto' })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            {isProgramador ? 'Mis proyectos' : 'Developers'}
          </h1>
          <p className="text-sm text-slate-400">
            Vista canvas · {programadores.length} programador
            {programadores.length !== 1 ? 'es' : ''} · {totalAsignados} asignaciones
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isProgramador && (
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
            onClick={() => fetchProjects(programadorId)}
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
          estadoOptions={ESTADO_OPTIONS_DEVELOPERS}
        />
        <Button variant="ghost" onClick={handleResetOrder}>
          <IoArrowUndoOutline size={16} />
          Restablecer orden
        </Button>
      </div>

      {error && editingProject === null && (
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
              No hay programadores cargados. Verificá que existan usuarios con rol
              “Programador”.
            </p>
          </div>
        ) : (
          <div className="flex h-full gap-4 overflow-x-auto pb-2">
            {columns.map(({ programador, projects: colProjects }) => (
              <ProjectColumn
                key={programador.id}
                user={programador}
                projects={colProjects}
                onSelectProject={openEditComentario}
                orderStorageKey={`programador-${programador.id}`}
                orderMode={ordenFiltro}
                resetSignal={resetKey}
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
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeEditComentario}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {isProgramador && programadorId !== undefined && (
        <ProjectsBycModal
          open={showBycModal}
          onClose={() => setShowBycModal(false)}
          roleName="Programador"
          userId={programadorId}
        />
      )}

      <CornerRestGif />
    </div>
  )
}
