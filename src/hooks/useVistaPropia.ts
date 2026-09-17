import { useState } from 'react'

const CLAVE = 'websy-vista-supervisor'

function leer(pagina: string): boolean {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Record<string, boolean>
    return guardado[pagina] ?? true
  } catch {
    return true
  }
}

function guardar(pagina: string, valor: boolean) {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Record<string, boolean>
    localStorage.setItem(CLAVE, JSON.stringify({ ...guardado, [pagina]: valor }))
  } catch {
    // Sin almacenamiento, el interruptor funciona igual durante la visita.
  }
}

/**
 * Para el Supervisor: ¿ve solo sus proyectos o los de todos? Arranca en
 * «solo los míos» y recuerda la última elección de cada página en este
 * navegador.
 */
export function useVistaPropia(pagina: string): [boolean, (valor: boolean) => void] {
  const [soloMios, setSoloMios] = useState(() => leer(pagina))
  const cambiar = (valor: boolean) => {
    setSoloMios(valor)
    guardar(pagina, valor)
  }
  return [soloMios, cambiar]
}
