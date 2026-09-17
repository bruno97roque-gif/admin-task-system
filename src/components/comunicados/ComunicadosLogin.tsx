import { useEffect } from 'react'
import { useComunicadosStore } from '../../stores/comunicadosStore'
import { ComunicadoAviso } from './ComunicadoAviso'

/** Los comunicados para la página de login. Se leen sin sesión. */
export function ComunicadosLogin() {
  const comunicados = useComunicadosStore((s) => s.login)
  const fetchLogin = useComunicadosStore((s) => s.fetchLogin)

  useEffect(() => {
    fetchLogin()
  }, [fetchLogin])

  if (comunicados.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      {comunicados.map((c) => (
        <ComunicadoAviso key={c.id} comunicado={c} />
      ))}
    </div>
  )
}
