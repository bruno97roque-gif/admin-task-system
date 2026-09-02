import { ProjectsListView } from '../components/projects/ProjectsListView'
import { useProjectsAdminStore } from '../stores/projectsAdminStore'

const GRUPO_BC_OPTIONS = [
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

export function ProjectsAdminPage() {
  const projects = useProjectsAdminStore((s) => s.projects)
  const loading = useProjectsAdminStore((s) => s.loading)
  const saving = useProjectsAdminStore((s) => s.saving)
  const error = useProjectsAdminStore((s) => s.error)
  const fetchProjects = useProjectsAdminStore((s) => s.fetchProjects)
  const createProject = useProjectsAdminStore((s) => s.createProject)
  const updateProject = useProjectsAdminStore((s) => s.updateProject)
  const updateProjectResponsables = useProjectsAdminStore((s) => s.updateProjectResponsables)

  return (
    <ProjectsListView
      title="En espera"
      description="Proyectos de los grupos B y C"
      grupoOptions={GRUPO_BC_OPTIONS}
      projects={projects}
      loading={loading}
      saving={saving}
      error={error}
      fetchProjects={fetchProjects}
      createProject={createProject}
      updateProject={updateProject}
      updateProjectResponsables={updateProjectResponsables}
    />
  )
}
