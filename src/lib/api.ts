import type { LoginResponse } from '../services/api'
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

let getAccessToken: () => string | null = () => null
let setSession: (data: LoginResponse) => void = () => {}
let clearSession: () => void = () => {}

export function setAccessTokenGetter(fn: () => string | null) {
  getAccessToken = fn
}

export function setSessionHandlers(
  onSetSession: (data: LoginResponse) => void,
  onClearSession: () => void,
) {
  setSession = onSetSession
  clearSession = onClearSession
}

const AUTH_PUBLIC_PATHS = new Set(['/auth/login', '/auth/refresh', '/auth/logout'])

function isAuthPublicPath(path: string): boolean {
  return AUTH_PUBLIC_PATHS.has(path)
}

let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      clearSession()
      return false
    }

    const data = (await response.json()) as LoginResponse
    setSession(data)
    return true
  } catch {
    clearSession()
    return false
  }
}

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (response.status === 401 && retry && !isAuthPublicPath(path)) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return apiFetch<T>(path, options, false)
    }
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
    throw createApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
