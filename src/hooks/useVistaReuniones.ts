import { useState } from 'react'

const CLAVE = 'websy-vista-reuniones'

export type VistaReuniones = 'lista' | 'mes' | 'semana'

const VALIDAS: VistaReuniones[] = ['lista', 'mes', 'semana']

/**
 * Lista, mes o semana en la pantalla de Reuniones. Arranca en lista y
 * recuerda la última elección en este navegador.
 */
export function useVistaReuniones(): [VistaReuniones, (valor: VistaReuniones) => void] {
  const [vista, setVista] = useState<VistaReuniones>(() => {
    try {
      const guardada = localStorage.getItem(CLAVE) as VistaReuniones | null
      return guardada && VALIDAS.includes(guardada) ? guardada : 'lista'
    } catch {
      return 'lista'
    }
  })

  const cambiar = (valor: VistaReuniones) => {
    setVista(valor)
    try {
      localStorage.setItem(CLAVE, valor)
    } catch {
      // Sin almacenamiento, el selector funciona igual durante la visita.
    }
  }

  return [vista, cambiar]
}
