import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from '../components/layout/Layout'
import { AnaliticaPage } from '../pages/AnaliticaPage'
import { ArchivadosPage } from '../pages/ArchivadosPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { ProjectsAdminPage } from '../pages/ProjectsAdminPage'
import { ProjectsByDisenoPage } from '../pages/ProjectsByDisenoPage'
import { ProjectsByProgramadorPage } from '../pages/ProjectsByProgramadorPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { RecordatoriosPage } from '../pages/RecordatoriosPage'
import { ProyectosTerminadosPage } from '../pages/ProyectosTerminadosPage'
import { RolesPage } from '../pages/RolesPage'
import { UsersPage } from '../pages/UsersPage'
import { VistaGlobalPage } from '../pages/VistaGlobalPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="proyectos" element={<ProjectsPage />} />
              <Route path="analitica" element={<AnaliticaPage />} />
              <Route path="vista-global" element={<VistaGlobalPage />} />
              <Route path="proyectos-terminados" element={<ProyectosTerminadosPage />} />
              <Route path="archivados" element={<ArchivadosPage />} />
              <Route path="projects/admin" element={<ProjectsAdminPage />} />
              <Route path="proyectos/programador" element={<ProjectsByProgramadorPage />} />
              <Route path="proyectos/diseno" element={<ProjectsByDisenoPage />} />
              <Route path="recordatorios" element={<RecordatoriosPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
