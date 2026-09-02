import { useEffect } from 'react'
import { IoLayersOutline } from 'react-icons/io5'
import { useProjectsAdminStore } from '../../stores/projectsAdminStore'
import { isProjectAssignee } from '../../utils/projectUsers'
import { Loader } from '../ui/Loader'
import { Modal } from '../ui/Modal'
import { ProjectCard } from './ProjectCard'

export function ProjectsBycModal({
  open,
  onClose,
  roleName,
  userId,
}: {
  open: boolean
  onClose: () => void
  roleName: 'Programador' | 'Diseñador'
  userId: number
}) {
  const projects = useProjectsAdminStore((s) => s.projects)
  const loading = useProjectsAdminStore((s) => s.loading)
  const fetchProjects = useProjectsAdminStore((s) => s.fetchProjects)

  useEffect(() => {
    if (open) fetchProjects()
  }, [open, fetchProjects])

  const propios = projects.filter((project) => isProjectAssignee(project, roleName, userId))

  return (
    <Modal open={open} onClose={onClose} title="Tus proyectos en grupos B y C">
      {loading && propios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Loader size={72} />
        </div>
      ) : propios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <IoLayersOutline size={28} className="text-slate-600" />
          <p className="text-sm text-slate-500">
            No tenés proyectos asignados en los grupos B y C.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {propios.map((project) => (
            <ProjectCard key={project.id} project={project} columnUserId={userId} />
          ))}
        </div>
      )}
    </Modal>
  )
}
