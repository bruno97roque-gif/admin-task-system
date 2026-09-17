import type { IconType } from 'react-icons'
import {
  IoAlertCircleOutline,
  IoInformationCircleOutline,
  IoMegaphoneOutline,
} from 'react-icons/io5'
import type { NivelComunicado } from '../types'

export const NIVELES: { value: NivelComunicado; label: string }[] = [
  { value: 'Info', label: 'Informativo' },
  { value: 'Importante', label: 'Importante' },
  { value: 'Urgente', label: 'Urgente' },
]

export const ESTILO_NIVEL: Record<NivelComunicado, { icon: IconType; className: string }> = {
  Info: {
    icon: IoInformationCircleOutline,
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  },
  Importante: {
    icon: IoMegaphoneOutline,
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  },
  Urgente: {
    icon: IoAlertCircleOutline,
    className: 'border-red-500/50 bg-red-500/15 text-red-100',
  },
}

/** Los urgentes se muestran siempre: nadie los puede cerrar. */
export const sePuedeCerrar = (nivel: NivelComunicado) => nivel !== 'Urgente'
