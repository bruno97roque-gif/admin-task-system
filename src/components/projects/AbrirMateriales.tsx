import { IoFolderOpenOutline, IoOpenOutline } from 'react-icons/io5'

/**
 * Acceso directo a la carpeta de Drive del proyecto, en el modal de los
 * tableros. Es lo primero que busca quien abre un proyecto, así que va con el
 * mismo peso que el ticket rápido y no escondido entre los detalles.
 *
 * Sin carpeta cargada no desaparece: avisa que falta, para que nadie piense que
 * se le perdió el botón, y apunta al ticket de «Falta material».
 */
export function AbrirMateriales({ enlace }: { enlace: string | null }) {
  // Solo enlaces web: lo que se guarde en el campo termina en un href, y un
  // `javascript:` ahí se ejecutaría al hacer clic.
  const esEnlaceWeb = !!enlace && /^https?:\/\//i.test(enlace.trim())

  if (!esEnlaceWeb) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-slate-500">
        <IoFolderOpenOutline size={16} className="shrink-0" />
        Todavía no hay carpeta de materiales. Si la necesitas, abre un ticket de «Falta
        material».
      </p>
    )
  }

  return (
    <a
      href={enlace.trim()}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent-hover transition-colors hover:bg-accent/20"
    >
      <IoFolderOpenOutline size={16} />
      Abrir materiales en Drive
      <IoOpenOutline size={14} className="opacity-70" />
    </a>
  )
}
