export interface Seguimiento {
  id: number
  name: string
}

export interface ProjectUsuarioAssignment {
  usuario: AppUser
}

export interface Project {
  id: number
  name: string
  estadoPago: string
  estadoProyecto: string
  descripcion: string
  tecnologia: string | null
  tipoProyecto: string | null
  grupo: string
  seguimientoId: number
  comentario: string
  diasSinResponder: number | null
  fechaEntrega: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  seguimiento: Seguimiento
  usuarios: (ProjectUsuarioAssignment | AppUser)[]
}

export interface Recordatorio {
  id: number
  descripcion: string
  estado: boolean
}

export interface Role {
  id: number
  name: string
}

export interface AuthUser {
  id: number
  name: string
  user: string
  roleId: number
  roleName: string
}

export interface AppUser {
  id: number
  name: string
  user: string
  active: boolean
  roleId: number
}
