import loadingGif from '../../assets/loading.gif'

export function Loader({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={loadingGif}
      alt="Cargando..."
      style={{ height: size, width: size }}
      className={`inline-block rounded-full object-cover ${className}`}
    />
  )
}

export function LoaderScreen({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface text-sm text-slate-400">
      <Loader size={120} />
      {label}
    </div>
  )
}

export function LoaderBlock({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Loader size={80} />
      {label}
    </div>
  )
}
