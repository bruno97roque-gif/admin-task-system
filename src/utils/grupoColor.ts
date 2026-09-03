const GRUPO_TEXT: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-amber-400',
  C: 'text-red-400',
}

export function grupoTextClass(grupo: string): string {
  return GRUPO_TEXT[grupo] ?? 'text-slate-400'
}

const GRUPO_BADGE: Record<string, string> = {
  A: 'bg-emerald-500/15 text-emerald-300',
  B: 'bg-amber-500/15 text-amber-300',
  C: 'bg-red-500/15 text-red-300',
}

export function grupoBadgeClass(grupo: string): string {
  return GRUPO_BADGE[grupo] ?? 'bg-accent/20 text-accent-hover'
}
