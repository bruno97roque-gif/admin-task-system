import { ProjectsListView } from '../components/projects/ProjectsListView'
import { useProjectsStore } from '../stores/projectsStore'

export function ProjectsPage() {
  const projects = useProjectsStore((s) => s.projects)
  const loading = useProjectsStore((s) => s.loading)
  const saving = useProjectsStore((s) => s.saving)
  const error = useProjectsStore((s) => s.error)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)
  const createProject = useProjectsStore((s) => s.createProject)
  const updateProject = useProjectsStore((s) => s.updateProject)
  const updateProjectResponsables = useProjectsStore((s) => s.updateProjectResponsables)
  const archiveProject = useProjectsStore((s) => s.archiveProject)

  return (
    <ProjectsListView
      title="Proyectos"
      description="Administra los proyectos del sistema"
      projects={projects}
      loading={loading}
      saving={saving}
      error={error}
      fetchProjects={fetchProjects}
      createProject={createProject}
      updateProject={updateProject}
      updateProjectResponsables={updateProjectResponsables}
      archiveProject={archiveProject}
    />
  )
}
