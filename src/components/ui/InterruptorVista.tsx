import { IoPeopleOutline, IoPersonOutline } from 'react-icons/io5'

/** «Mis proyectos» / «Todos», para el Supervisor. */
export function InterruptorVista({
  soloMios,
  onChange,
}: {
  soloMios: boolean
  onChange: (soloMios: boolean) => void
}) {
  const opcion = (activo: boolean) =>
    `inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
      activo ? 'bg-accent text-white shadow' : 'text-slate-400 hover:text-slate-200'
    }`

  return (
    <div
      role="group"
      aria-label="Qué proyectos ver"
      className="flex w-full rounded-lg border border-border bg-surface-raised p-1 sm:w-auto"
    >
      <button
        type="button"
        aria-pressed={soloMios}
        className={opcion(soloMios)}
        onClick={() => onChange(true)}
      >
        <IoPersonOutline size={16} />
        Mis proyectos
      </button>
      <button
        type="button"
        aria-pressed={!soloMios}
        className={opcion(!soloMios)}
        onClick={() => onChange(false)}
      >
        <IoPeopleOutline size={16} />
        Todos
      </button>
    </div>
  )
}
