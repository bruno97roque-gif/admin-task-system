import { API_URL } from '../config/app'

export interface ApiError extends Error {
  status: number
}

export function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError
  error.name = 'ApiError'
  error.status = status
  return error
}

/**
 * Qué hacer cuando el API dice que la sesión ya no vale (venció, la cerraron
 * desde otro lado, cambió la contraseña). Lo conecta `main.tsx`.
 */
let alPerderSesion: () => void = () => {}

export function setSesionPerdidaHandler(fn: () => void) {
  alPerderSesion = fn
}

/**
 * Rutas donde un 401 no significa «se cerró tu sesión»: el login (clave mala)
 * y la consulta de sesión al abrir la app.
 */
const SIN_SESION = new Set([
  '/api/auth/sign-in/username',
  '/api/auth/get-session',
  '/perfil',
  '/auth/recuperar-contrasena',
])

/** Mensajes de better-auth que pueden llegar en inglés. */
function enCastellano(status: number, mensaje: string): string {
  if (status === 429 && /too many/i.test(mensaje)) {
    return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
  }
  return mensaje
}

/**
 * Pedido al API. La sesión viaja sola en una cookie httpOnly
 * (`credentials: 'include'`): el front no guarda ni manda tokens.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (response.status === 401 && !SIN_SESION.has(path)) {
    alPerderSesion()
  }

  if (!response.ok) {
    let message = response.statusText
    try {
      const body = await response.json()
      message = body.message ?? body.error ?? message
      if (Array.isArray(message)) {
        message = message.join(', ')
      }
    } catch {
      // respuesta no JSON
    }
    throw createApiError(response.status, enCastellano(response.status, String(message)))
  }

  if (response.status === 204) {
    return undefined as T
  }

  // Algunas rutas de better-auth responden 200 sin cuerpo.
  const texto = await response.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}
