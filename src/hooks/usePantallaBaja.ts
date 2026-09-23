import { useEffect, useState } from 'react'

const CONSULTA = '(max-height: 800px)'

/**
 * ¿La ventana es baja? El dashboard entra completo en la pantalla, así que
 * en pantallas bajas muestra un poco menos en sus listas.
 */
export function usePantallaBaja(): boolean {
  const [baja, setBaja] = useState(() => window.matchMedia(CONSULTA).matches)

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA)
    const alCambiar = () => setBaja(consulta.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  return baja
}
