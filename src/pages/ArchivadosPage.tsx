import { useEffect, useState } from 'react'
import {
  IoArrowUndoOutline,
  IoFolderOpenOutline,
  IoRefreshOutline,
  IoTrashOutline,
} from 'react-icons/io5'
import type { ProjectArchivado } from '../types'
import { useArchivedProjectsStore } from '../stores/archivedProjectsStore'
import { getEstadoProyectoLabel } from '../utils/projectStatus'
import { grupoTextClass } from '../utils/grupoColor'
import { formatDateDisplay } from '../utils/date'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

export function ArchivadosPage() {
  const projects = useArchivedProjectsStore((s) => s.projects)
  const loading = useArchivedProjectsStore((s) => s.loading)
  const saving = useArchivedProjectsStore((s) => s.saving)
  const error = useArchivedProjectsStore((s) => s.error)
  const fetchProjects = useArchivedProjectsStore((s) => s.fetchProjects)
  const deleteProject = useArchivedProjectsStore((s) => s.deleteProject)
  const reactivarProject = useArchivedProjectsStore((s) => s.reactivarProject)

  const [projectToDelete, setProjectToDelete] = useState<ProjectArchivado | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [projectToReactivar, setProjectToReactivar] = useState<ProjectArchivado | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const openDelete = (project: ProjectArchivado) => {
    setProjectToDelete(project)
    setDeleteName('')
    setDeleteModalOpen(true)
  }

  const cancelDelete = () => {
    if (saving) return
    setProjectToDelete(null)
    setDeleteModalOpen(false)
    setDeleteName('')
  }

  const confirmDelete = async () => {
    if (!projectToDelete || deleteName.trim() !== projectToDelete.name) return
    const result = await deleteProject(projectToDelete.id)
    if (result.success) cancelDelete()
  }

  const cancelReactivar = () => {
    if (saving) return
    setProjectToReactivar(null)
  }

  const confirmReactivar = async () => {
    if (!projectToReactivar) return
    const result = await reactivarProject(projectToReactivar.id)
    if (result.success) setProjectToReactivar(null)
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Archivados</h1>
          <p className="text-sm text-slate-400">
            Proyectos archivados · {projects.length}{' '}
            {projects.length === 1 ? 'proyecto' : 'proyectos'}
          </p>
        </div>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => fetchProjects()}
          loading={loading}
        >
          <IoRefreshOutline size={18} />
          Actualizar
        </Button>
      </header>

      {error && !deleteModalOpen && !projectToReactivar && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Etapa al archivar</th>
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Seguimiento</th>
              <th className="px-4 py-3 font-medium">Archivado el</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Cargando proyectos archivados...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay proyectos archivados
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 text-slate-400">{project.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      <IoFolderOpenOutline className="shrink-0 text-accent" size={16} />
                      {project.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {project.etapaAlArchivar ? getEstadoProyectoLabel(project.etapaAlArchivar) : '—'}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${grupoTextClass(project.grupo)}`}>
                    {project.grupo}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{project.seguimiento?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDateDisplay(project.archivadoAt) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setProjectToReactivar(project)}
                        aria-label={`Reactivar ${project.name}`}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <IoArrowUndoOutline size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => openDelete(project)}
                        aria-label={`Eliminar ${project.name}`}
                        className="text-red-400 hover:text-red-300"
                      >
                        <IoTrashOutline size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={projectToReactivar !== null}
        title="Reactivar proyecto"
        message={`¿Reactivar "${projectToReactivar?.name}"? Vuelve a la etapa que tenía al archivarse. Si pasó un año archivado, se rehacen inicio y diseño y vuelve a Brief.`}
        confirmLabel="Reactivar"
        onConfirm={confirmReactivar}
        onCancel={cancelReactivar}
        loading={saving}
        error={projectToReactivar ? error : null}
      />

      <Modal open={deleteModalOpen} onClose={cancelDelete} title="Eliminar definitivamente" size="sm">
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <p className="text-sm text-slate-300">
            Esta acción no se puede deshacer. Escribe{' '}
            <strong className="text-slate-100">{projectToDelete?.name}</strong> para confirmar.
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
              type="button"
              variant="danger"
              className="w-full sm:w-auto"
              loading={saving}
              disabled={deleteName.trim() !== projectToDelete?.name}
              onClick={confirmDelete}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
