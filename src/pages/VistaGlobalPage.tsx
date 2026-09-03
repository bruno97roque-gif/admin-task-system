import { useEffect, useMemo, useState } from 'react'
import { IoSnowOutline, IoRefreshOutline } from 'react-icons/io5'
import type { Project } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useProjectsStore } from '../stores/projectsStore'
import { isProjectAssignee } from '../utils/projectUsers'
import {
  ESTADO_PROYECTO_ORDER,
  estadoProyectoClass,
  getEstadoProyectoLabel,
} from '../utils/projectStatus'
import { Button } from '../components/ui/Button'
import { LoaderBlock } from '../components/ui/Loader'
import { ProjectEditModal } from '../components/projects/ProjectEditModal'
import { PersonColorLegend } from '../components/projects/PersonColorLegend'
import { getUserColor } from '../utils/userColors'

const ETAPAS_DISENADOR = ['Brief', 'Taxonomia', 'Diseno', 'AvanceDiseno', 'DisenoFinalizado']

// Solo en el trabajo de diseño propiamente dicho el color sigue al
// diseñador; Registro/Brief/Taxonomía (antes de que arranque el diseño) y
// Desarrollo en adelante siguen al desarrollador.
const ETAPAS_COLOR_DISENO = ['Diseno', 'AvanceDiseno', 'DisenoFinalizado']

// Proyecto Finalizado tiene su propia ventana aparte ("Proyectos Terminados"):
// acá solo va el flujo activo.
const ETAPAS_VISTA_GLOBAL = ESTADO_PROYECTO_ORDER.filter(
  (etapa) => etapa !== 'ProyectoFinalizado',
)

export function VistaGlobalPage() {
  const authUser = useAuthStore((s) => s.user)
  const roleName = authUser?.roleName
  const isProgramador = roleName === 'Programador'
  const isDisenador = roleName === 'Diseñador'

  const projects = useProjectsStore((s) => s.projects)
  const loading = useProjectsStore((s) => s.loading)
  const saving = useProjectsStore((s) => s.saving)
  const error = useProjectsStore((s) => s.error)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)
  const updateProject = useProjectsStore((s) => s.updateProject)
  const updateProjectResponsables = useProjectsStore((s) => s.updateProjectResponsables)

  const [mostrarByC, setMostrarByC] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const etapas = useMemo(
    () => (isDisenador ? ETAPAS_DISENADOR : ETAPAS_VISTA_GLOBAL),
    [isDisenador],
  )

  const filtroAsignado = useMemo(() => {
    if (isProgramador && authUser) {
      return (p: Project) => isProjectAssignee(p, 'Programador', authUser.id)
    }
    if (isDisenador && authUser) {
      return (p: Project) => isProjectAssignee(p, 'Diseñador', authUser.id)
    }
    return null
  }, [isProgramador, isDisenador, authUser])

  const visibles = useMemo(() => {
    let lista = filtroAsignado ? projects.filter(filtroAsignado) : projects
    if (!mostrarByC) {
      lista = lista.filter((p) => p.grupo === 'A')
    }
    return lista
  }, [projects, filtroAsignado, mostrarByC])

  const columnas = useMemo(
    () =>
      etapas.map((etapa) => ({
        etapa,
        esEtapaDiseno: ETAPAS_COLOR_DISENO.includes(etapa),
        proyectos: visibles.filter((p) => p.estadoProyecto === etapa),
      })),
    [etapas, visibles],
  )

  const mostrarLeyenda = !isProgramador && !isDisenador

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Vista Global</h1>
          <p className="text-sm text-slate-400">
            {isDisenador
              ? 'Tus proyectos, de Brief a Diseño Finalizado'
              : isProgramador
                ? 'Tus proyectos, en todas las etapas'
                : `Todos los proyectos · ${visibles.length} en el flujo activo`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant={mostrarByC ? 'primary' : 'secondary'}
            className="w-full sm:w-auto"
            onClick={() => setMostrarByC((v) => !v)}
          >
            <IoSnowOutline size={18} />
            {mostrarByC ? 'Ocultar congelados' : 'Mostrar congelados'}
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={fetchProjects}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
        </div>
      </header>

      {mostrarLeyenda && <PersonColorLegend />}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {loading && projects.length === 0 ? (
          <LoaderBlock label="Cargando proyectos..." />
        ) : (
          <div className="flex h-full gap-3 overflow-x-auto pb-2">
            {columnas.map(({ etapa, esEtapaDiseno, proyectos }) => (
              <section
                key={etapa}
                className="flex w-44 shrink-0 flex-col rounded-xl border border-border bg-surface-raised"
              >
                <header className="border-b border-border p-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoProyectoClass(etapa)}`}
                  >
                    {getEstadoProyectoLabel(etapa)}
                  </span>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {proyectos.length} {proyectos.length === 1 ? 'proyecto' : 'proyectos'}
                  </p>
                </header>

                <div className="flex-1 space-y-1 overflow-y-auto p-2">
                  {proyectos.length === 0 ? (
                    <p className="px-1 py-4 text-center text-xs text-slate-600">—</p>
                  ) : (
                    proyectos.map((project) => {
                      const color = getUserColor(
                        esEtapaDiseno ? project.disenadorId : project.desarrolladorId,
                      )
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => setEditingProject(project)}
                          className={`flex w-full items-center gap-1.5 truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                            project.grupo === 'A'
                              ? 'bg-surface text-slate-200 hover:bg-surface-overlay'
                              : 'border border-dashed border-border bg-surface/60 text-slate-400 hover:bg-surface/80'
                          }`}
                          title={`${project.name}${color ? ` — ${color.label}` : ''}${project.grupo !== 'A' ? ` — Grupo ${project.grupo}` : ''}`}
                        >
                          {color && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: color.hex }}
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate">{project.name}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <ProjectEditModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
        saving={saving}
        updateProject={updateProject}
        updateProjectResponsables={updateProjectResponsables}
      />
    </div>
  )
}
