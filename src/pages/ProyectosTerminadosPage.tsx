import { useMemo } from 'react'
import { ProjectsListView } from '../components/projects/ProjectsListView'
import { useProjectsStore } from '../stores/projectsStore'

export function ProyectosTerminadosPage() {
  const allProjects = useProjectsStore((s) => s.projects)
  const loading = useProjectsStore((s) => s.loading)
  const saving = useProjectsStore((s) => s.saving)
  const error = useProjectsStore((s) => s.error)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)
  const createProject = useProjectsStore((s) => s.createProject)
  const updateProject = useProjectsStore((s) => s.updateProject)
  const updateProjectResponsables = useProjectsStore((s) => s.updateProjectResponsables)
  const deleteProject = useProjectsStore((s) => s.deleteProject)

  const proyectosTerminados = useMemo(
    () => allProjects.filter((p) => p.estadoProyecto === 'ProyectoFinalizado'),
    [allProjects],
  )

  return (
    <ProjectsListView
      title="Finalizados"
      description="Proyectos que ya llegaron a Proyecto Finalizado"
      projects={proyectosTerminados}
      loading={loading}
      saving={saving}
      error={error}
      fetchProjects={fetchProjects}
      createProject={createProject}
      updateProject={updateProject}
      updateProjectResponsables={updateProjectResponsables}
      deleteProject={deleteProject}
    />
  )
}
