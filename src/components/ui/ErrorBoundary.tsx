import { Component, type ErrorInfo, type ReactNode } from 'react'
import { IoRefreshOutline, IoWarning } from 'react-icons/io5'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Red de seguridad: sin esto, cualquier error durante el render deja la
 * pantalla completamente en blanco, sin menú y sin forma de salir. Acá se
 * muestra qué pasó y se ofrece recargar, que es lo que resuelve el caso más
 * común (una pestaña vieja contra una API ya actualizada).
 *
 * Tiene que ser un componente de clase: los hooks no pueden atrapar errores.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado:', error, info.componentStack)
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-red-500/20 p-3 text-red-400">
          <IoWarning size={28} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Algo se rompió en esta pantalla</h1>
          <p className="mt-1 max-w-md text-sm text-slate-400">
            Suele pasar cuando la pestaña quedó abierta con una versión anterior del
            sistema. Recargar lo resuelve casi siempre.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <IoRefreshOutline size={18} />
          Recargar
        </button>
        <pre className="max-w-lg overflow-x-auto rounded-lg border border-border bg-surface-raised px-3 py-2 text-left text-xs text-slate-500">
          {error.message}
        </pre>
      </div>
    )
  }
}
