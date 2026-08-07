# AGENTS.md — admin-project-system

Guía para que cualquier agente (humano o IA) entienda el proyecto rápidamente.

## Qué es

**Websy Admin** es el panel de administración interno de Websy (estudio de desarrollo web). Es un SPA de gestión de proyectos, usuarios, roles, seguimientos y recordatorios. UI oscura, en español, uso interno del equipo.

## Stack técnico

- **React 19** + **TypeScript** (target ES2023, `verbatimModuleSyntax`, `erasableSyntaxOnly`)
- **Vite 8** como bundler/dev server
- **Tailwind CSS v4** vía `@tailwindcss/vite` (sin `tailwind.config.js`; tokens en `@theme` dentro de `src/index.css`)
- **react-router v8** (modo declarative: `BrowserRouter` + rutas anidadas). Imports desde `react-router` (en v8 se eliminó el paquete `react-router-dom`).
- **zustand v5** para estado global (solo `authStore` usa `persist`)
- **react-hook-form** para formularios
- **react-icons** (`react-icons/io5`)
- **ESLint** con `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

No usa: Axios, Redux, TanStack Query, Zod, librerías de UI de terceros. Todo UI es propio y minimal.

## Estructura

```
src/
  App.tsx                # Solo monta <AppRouter />
  main.tsx               # Bootstrap: registra el getter del token y renderiza
  index.css              # Tailwind v4 + @theme con tokens de color
  routes/
    AppRouter.tsx        # Rutas (login + protegidas con Layout)
    ProtectedRoute.tsx   # Guard de auth basado en useAuthStore
    RoleGuard.tsx        # Restringe rutas según rol (Programador / Diseñador)
  components/
    layout/Layout.tsx             # Sidebar drawer (móvil) + outlet + alertas
    projects/ProjectsListView.tsx # Tabla + filtros + modal CRUD de proyectos (reutilizable)
    reminders/ReminderAlert.tsx   # Modal de alerta con lista de activos
    ui/                           # Button, Input, DateInput, Select, Textarea, Modal,
                                  #   ConfirmDialog, MultiSelect, SearchableMultiSelect
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    RolesPage.tsx
    UsersPage.tsx
    ProjectsPage.tsx
    ProjectsAdminPage.tsx           # Proyectos grupos B y C (/projects/admin)
    ProjectsByProgramadorPage.tsx   # Vista canvas (kanban por programador)
    ProjectsByDisenoPage.tsx        # Vista canvas (kanban por diseñador)
    RecordatoriosPage.tsx
  stores/                # zustand
    authStore.ts                    # persist solo `user` (clave "websy-user"); token en memoria
    projectsStore.ts                # sin persist
    projectsAdminStore.ts           # sin persist; proyectos B/C
    projectsByProgramadorStore.ts   # sin persist (vista canvas programador)
    projectsByDisenoStore.ts        # sin persist (vista canvas diseño)
    usersStore.ts                   # sin persist
    rolesStore.ts                   # sin persist
    seguimientosStore.ts            # sin persist
    recordatoriosStore.ts           # sin persist; CRUD contra /recordatorio
  services/api.ts        # Funciones que llaman al backend vía apiFetch
  lib/api.ts             # apiFetch + ApiError + getter de token inyectable
  config/app.ts          # API_URL desde env
  hooks/useRecordatoriosReminders.ts  # Alerta cada 5 min con recordatorios activos
  utils/                 # assignableUsers, projectUsers, roleAccess, date, password, id
  types/index.ts         # Tipos de dominio
```

## Rutas

| Path                       | Página                    | Protegida | Roles restringidos |
| -------------------------- | ------------------------- | --------- | ------------------ |
| `/login`                   | LoginPage                 | no        | —                  |
| `/`                        | Dashboard                 | sí        | admin              |
| `/roles`                   | Roles                     | sí        | admin              |
| `/usuarios`                | Users                     | sí        | admin              |
| `/proyectos`               | Projects                  | sí        | admin              |
| `/projects/admin`          | ProjectsAdminPage         | sí        | admin              |
| `/proyectos/programador`   | ProjectsByProgramadorPage | sí        | admin, Programador |
| `/proyectos/diseno`        | ProjectsByDisenoPage      | sí        | admin, Diseñador   |
| `/recordatorios`           | Recordatorios             | sí        | admin              |

Cualquier path desconocido redirige a `/`.

### Acceso por rol (`utils/roleAccess.ts` + `RoleGuard`)

- **Programador**: solo `/proyectos/programador` (home tras login). Sin recordatorios ni resto del menú.
- **Diseñador**: solo `/proyectos/diseno` (home tras login). Sin recordatorios ni resto del menú.
- **Admin / otros roles**: acceso completo según menú.
- `getHomePathForRole(roleName)` define la redirección post-login y cuando `RoleGuard` bloquea una ruta.

## Tipos de dominio (`src/types/index.ts`)

```ts
Seguimiento      { id: number, name: string }
Project           { id, name, estadoPago, estadoProyecto, descripcion, tecnologia,
                    tipoProyecto, grupo, seguimientoId, comentario, diasSinResponder,
                    fechaEntrega, createdAt, updatedAt, deletedAt,
                    seguimiento: Seguimiento,
                    usuarios: (ProjectUsuarioAssignment | AppUser)[] }
Recordatorio      { id: number, descripcion: string, estado: boolean }  // estado=true activo
Role              { id: number, name: string }
AuthUser          { id, name, user, roleId, roleName }
AppUser           { id, name, user, active, roleId }
```

Notas:
- `Project.usuarios` puede venir como `AppUser` plano o como `{ usuario: AppUser }`. Usar `utils/projectUsers` que abstrae ambos formatos.
- `Recordatorio.estado`: `true` = activo, `false` = finalizado.

## Autenticación

- Login: `POST /auth/login` → `{ accessToken, user }` + cookie httpOnly de refresh (`Set-Cookie`, `Path=/auth`).
- Refresh: `POST /auth/refresh` sin body ni `Authorization`; **obligatorio** `credentials: 'include'`. Respuesta igual que login (token + user fresco desde DB).
- Logout: `POST /auth/logout` → `204 No Content` (borra cookie). No parsear `.json()` en 204.
- **Access token**: solo en memoria. Nunca `localStorage`/`sessionStorage`.
- **User**: persistido en `localStorage` (clave `websy-user`, vía zustand `partialize`). Se actualiza en login/refresh y se borra en logout o sesión inválida.
- **Refresh token**: cookie httpOnly; el front no la lee ni la envía a mano.
- `apiFetch` inyecta `Authorization: Bearer` + `credentials: 'include'` en todas las peticiones.
- En `401` de rutas protegidas: intenta `refreshSession()` **una vez** (`retry=false` en reintento). Dedupe con `refreshPromise` compartida.
- Rutas `/auth/login`, `/auth/refresh`, `/auth/logout` no disparan auto-refresh en 401.
- Al arrancar (`App.tsx`): `refreshSession()` para rehidratar sesión tras recarga; pantalla "Cargando sesión..." hasta `sessionHydrated`.
- `ProtectedRoute` espera `sessionHydrated` antes de redirigir a `/login`.
- Handlers de sesión registrados en `main.tsx` vía `setSessionHandlers` (evita dependencia circular).
- Al migrar desde persist viejo: `localStorage.removeItem('websy-auth')` en bootstrap (solo el key antiguo que guardaba el JWT).

## Backend / API

- Base URL: `import.meta.env.VITE_API_URL` (default `http://localhost:3000`).
- `apiFetch` lanza `ApiError` con `status` y `message` (string o array joinado).
- Status 204 → retorna `undefined`.

### Endpoints

| Método | Path                          | Body / Notas                                                    |
| ------ | ----------------------------- | --------------------------------------------------------------- |
| POST   | `/auth/login`                 | `{ user, password }` → `{ accessToken, user }` + Set-Cookie |
| POST   | `/auth/refresh`               | sin body; cookie httpOnly; respuesta igual que login |
| POST   | `/auth/logout`                | `204` sin body; borra cookie |
| GET    | `/rol`                        | lista de roles                                                  |
| POST   | `/rol`                        | `{ name }`                                                      |
| GET    | `/user`                       | lista de usuarios                                               |
| POST   | `/user`                       | `{ name, user, password, roleId }`                             |
| GET    | `/projects`                   | lista de proyectos                                              |
| POST   | `/projects`                   | `{ name, descripcion, grupo, seguimientoId, comentario, usuariosIds? }` |
| PATCH  | `/projects/:id`               | `{ name, descripcion, grupo, seguimientoId, comentario, tecnologia, estadoPago, estadoProyecto, diasSinResponder }` |
| POST   | `/projects/:id/usuarios`       | `{ usuariosIds: number[] }`                                    |
| GET    | `/projects/programador`       | proyectos con sus usuarios (vista canvas)                       |
| GET    | `/seguimiento`                | lista de seguimientos                                           |
| GET    | `/recordatorio`               | lista de recordatorios                                          |
| POST   | `/recordatorio`               | `{ descripcion }`                                               |
| GET    | `/recordatorio/:id`           | un recordatorio                                                 |
| PATCH  | `/recordatorio/:id`           | `{ descripcion?, estado? }`                                     |
| DELETE | `/recordatorio/:id`           | —                                                               |

## Stores (zustand)

Patrón uniforme: estado `{ loading, saving, error }` + acciones que devuelven `{ success: boolean; error?: string }`.

- **`authStore`** (persist `websy-user`, solo `user`): `accessToken` en memoria, `isAuthenticated`, `login(user, password)`, `logout()`.
- **`projectsAdminStore`**: igual patrón que `projectsStore`, filtrado a grupos B/C.
- **`projectsStore`**: `projects`, `fetchProjects()`, `createProject(data)`, `updateProject(id, data, usuariosIds)`, `getProjectById(id)`.
- **`projectsByProgramadorStore`**: `projects`, `fetchProjectsByProgramador(programadorId?)`, `updateProjectComentario()`. Canvas programador; edición limitada a comentario/fecha.
- **`projectsByDisenoStore`**: `projects`, `fetchProjectsByDiseno()`. Canvas diseño, solo lectura.
- **`usersStore`**: `users`, `fetchUsers()`, `createUser(data)`.
- **`rolesStore`**: `roles`, `fetchRoles()`, `createRole(name)`.
- **`seguimientosStore`**: `seguimientos`, `fetchSeguimientos()`.
- **`recordatoriosStore`**: `recordatorios`, `fetchRecordatorios()`, `createRecordatorio({ descripcion })`, `updateRecordatorio(id, { descripcion?, estado? })`, `finalizeRecordatorio(id)` (PATCH `estado: false` con optimistic update), `deleteRecordatorio(id)`.

## Componentes UI (`src/components/ui/`)

Propios, minimalistas, usan tokens de `@theme`. No meter librerías externas; extender estos.

- **`Button`** — variantes `primary`/`secondary`/`danger`/`ghost`/`success`. Props: `variant`, `loading`, `disabled` + nativos.
- **`Input`** — `forwardRef`. Props: `label`, `error` + nativos.
- **`Textarea`** — `forwardRef`. Props: `label`, `error`. `min-h-[80px]`.
- **`Select`** — `forwardRef`. Props: `label`, `options: { value, label }[]`, `placeholder`, `error`.
- **`DateInput`** — input de fecha con `label`; integración vía `Controller`.
- **`Modal`** — props: `open`, `onClose`, `title`, `size` (`sm`/`md`/`lg`). Backdrop con blur; en móvil ocupa ancho completo con scroll interno y esquinas superiores redondeadas (sheet-like).
- **`ConfirmDialog`** — props: `open`, `title`, `message`, `onConfirm`, `onCancel`, `confirmLabel`.
- **`MultiSelect`** / **`SearchableMultiSelect`** — selección múltiple con buscador.

## Utilidades (`src/utils/`)

- **`assignableUsers.ts`**:
  - `ASSIGNABLE_ROLE_NAMES = ['Programador', 'Diseñador']`
  - `getRoleIdByName(roles, 'Programador')`
  - `getUsersByRoleName(users, roles, 'Programador')` → filtra usuarios por rol.
  - `splitUserIdsByRole(userIds, roles, users)` → `{ programadoresIds, disenadoresIds }`.
  - `mergeUserIds(programadoresIds, disenadoresIds)` → `number[]`.
  - `toSelectOptions(users)` → `{ value, label }[]`.
- **`projectUsers.ts`**:
  - `getProjectUserNames(project)` → string joinado (o "Sin asignar").
  - `getProjectUserIds(project)` → `number[]`.
  - Abstrae el formato dual de `project.usuarios`.
- **`roleAccess.ts`**: `getHomePathForRole`, `isRestrictedRole`, `canAccessPath`, `canAccessNavPath`.
- **`date.ts`**: `toDateInputValue`, `formatDateDisplay`.
- **`password.ts`**: `generatePassword()` para alta de usuarios.
- **`id.ts`**: `generateId()` → `crypto.randomUUID()`.

## Módulos / Páginas

### Dashboard (`/`)
- Stats: usuarios, roles, proyectos activos, **recordatorios activos**, proyectos finalizados.
- Sección "Proyectos recientes" (top 5) y "Recordatorios activos" (top 5).
- Carga `users`, `roles`, `projects`, `recordatorios` al montar.

### Roles (`/roles`)
- Listado + creación (`POST /rol` con `{ name }`).

### Usuarios (`/usuarios`)
- Listado + creación (`POST /user` con `{ name, user, password, roleId }`).

### Proyectos (`/proyectos`, `/projects/admin`)
- Componente compartido `ProjectsListView` con tabla, filtros (buscar, grupo, estado) y modal crear/editar.
- `/proyectos`: todos los grupos (A/B/C). `/projects/admin`: solo grupos B y C (`projectsAdminStore`).
- Formulario con `react-hook-form` + `Controller` para `SearchableMultiSelect`, `DateInput`, etc.
- Al editar: `PATCH /projects/:id` + `POST /projects/:id/usuarios` (usuarios se asignan aparte).
- Opciones hardcodeadas: grupos (A/B/C o B/C según vista), `ESTADO_PROYECTO_OPTIONS`, `TECNOLOGIA_OPTIONS`.
- Tabla con scroll horizontal en pantallas estrechas (`overflow-x-auto`, `min-w-[1024px]`).

### Proyectos por Programador (`/proyectos/programador`) — Vista canvas
- Tablero horizontal tipo Kanban: **una columna por programador** (rol Programador ve solo su columna).
- Identifica programadores cruzando `users` + `roles` con `getUsersByRoleName(users, roles, 'Programador')`.
- Columna: avatar (iniciales), nombre, `user`, contador de proyectos. Ancho adaptable (`w-[min(100%,20rem)]` en móvil, `sm:w-80` en desktop).
- Card clickeable: edición de comentario y fecha de entrega vía modal.
- Layout `flex-1 min-h-0` dentro del shell del Layout; scroll horizontal entre columnas y vertical dentro de cada columna.
- Sin drag-and-drop. Empty state si no hay programadores.

### Diseño (`/proyectos/diseno`) — Vista canvas
- Misma estructura que programador pero columnas por **Diseñador** (`projectsByDisenoStore`).
- Solo lectura + botón "Actualizar".

### Recordatorios (`/recordatorios`)
- CRUD completo contra `/recordatorio`.
- Cada item: badge Activo/Finalizado + descripción con `whitespace-pre-wrap` (texto largo, saltos de línea).
- Botones por item: **Finalizado** (solo si activo → `PATCH estado: false`), editar, eliminar.
- Toggle "Mostrar finalizados".
- Banner amarillo cuando hay activos, recordando la alerta cada 5 min.
- Modal de crear/editar con `Textarea`.
- `ConfirmDialog` antes de eliminar (preview de descripción truncada a 80 chars).

## Flujo de alertas de recordatorios

Implementado en `src/hooks/useRecordatoriosReminders.ts`, montado en `Layout.tsx` (corre en toda la app autenticada):

1. Al montar: `fetchRecordatorios()` + pedir permiso de notificaciones del browser.
2. Si hay recordatorios con `estado === true`, arranca un `setInterval` de **5 minutos**.
3. Cada tick: abre `ReminderAlert`, reproduce un beep (Web Audio API, 880Hz sine) y manda una `Notification` del browser por cada activo.
4. El modal lista los activos con botón **Finalizado** inline (cada uno hace `PATCH estado: false` con optimistic update). Al finalizar el último, el modal se cierra solo.
5. Botones del modal: "Ir a recordatorios" (navega a `/recordatorios`) y "Cerrar (volverá en 5 min)".
6. Si no hay activos, el intervalo se detiene.

## Responsive / layout

Breakpoint principal: **`lg` (1024px)** — sidebar fijo a la izquierda; por debajo, drawer deslizable.

- **`Layout.tsx`**: barra superior móvil (`h-14`) con botón hamburguesa; sidebar off-canvas con overlay, cierre por backdrop/Escape y al navegar; `main` con padding `p-4 sm:p-6 lg:p-8`; cadena `flex min-h-dvh` + `min-h-0` para vistas canvas a altura completa.
- **Cabeceras de página**: títulos `text-xl sm:text-2xl`; acciones en columna (`w-full`) en móvil y fila en `sm+`.
- **Tablas**: envolver en `overflow-x-auto`; anchos mínimos donde haga falta (proyectos ~1024px, usuarios ~640px).
- **Modales / diálogos**: scroll interno, botones apilados en móvil (`flex-col-reverse sm:flex-row`), sheet-like en pantallas pequeñas.
- **Canvas (kanban)**: columnas más estrechas en móvil; scroll horizontal del tablero.
- **`index.css`**: `min-height: 100dvh`, `overflow-x: hidden` en `html`/`body`.

## Convenciones

- **Lenguaje del código y UI**: español (labels, mensajes, nombres de stores). Identificadores en inglés o español según convenga.
- **Componentes**: function declarations (`export function X`), no default exports excepto `App`. Inputs/textarea/select usan `forwardRef` para integrar con `react-hook-form`.
- **Styling**: Tailwind v4 con tokens del `@theme` en `src/index.css`:
  - `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-border`, `--color-accent`, `--color-accent-hover`.
  - UI oscura por defecto (`color-scheme: dark`).
  - Clases: `bg-surface`, `bg-surface-raised`, `border-border`, `text-accent`, etc.
- **Estado**: zustand plano, un store por dominio. Sin `persist` (auth en memoria + cookie httpOnly).
- **Formularios**: `react-hook-form` con `register` para inputs simples y `Controller` para multiselects. Validaciones inline.
- **Errores**: stores devuelven `{ success: boolean; error?: string }` y guardan `error` en el estado. Páginas muestran `error` en banner rojo cuando el modal está cerrado, o `setError('root', ...)` cuando está abierto.
- **Optimistic updates**: `finalizeRecordatorio` actualiza el estado local junto con el PATCH para que la UI reaccione al instante.
- **Sin comentarios obvios**: el código se documenta solo. Comentarios solo para "por qué", no para "qué".

## Comandos

```bash
pnpm install        # instalar deps
pnpm dev            # levantar Vite en modo desarrollo
pnpm build          # tsc -b && vite build (salida en dist/)
pnpm lint           # eslint .
pnpm preview        # previsualizar el build
```

## Variables de entorno

- `VITE_API_URL` — URL del backend (default `http://localhost:3000`). Ver `.env.example`.

## Decisiones de diseño

- **Sin librería de UI externa**: componentes `ui/` propios. Si se necesita algo nuevo, extenderlos antes de meter una dependencia.
- **Recordatorios en backend**: persisten en `/recordatorio`, no en localStorage. `estado=true` activo; "Finalizado" hace `PATCH estado: false`.
- **Alertas de recordatorios**: `useRecordatoriosReminders` cada 5 min mientras haya activos, con sonido + notificación del browser + modal con botón "Finalizado" inline.
- **Vista canvas**: tableros horizontales por programador o diseñador; roles restringidos ven solo su vista.
- **Responsive mobile-first**: drawer lateral, tablas con scroll horizontal, modales adaptados; sin librerías extra.
- **Sin tests todavía**: si se agregan, preferir Vitest.
