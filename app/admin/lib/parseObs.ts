const DIVISOR = '\n---\n'

function extractField(obs: string | undefined, field: string): string | null {
  if (!obs) return null
  const sepIdx = obs.indexOf(DIVISOR)
  const section = sepIdx !== -1 ? obs.slice(sepIdx) : obs
  return section.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null
}

export const parseMotoboy    = (obs?: string) => extractField(obs, 'Motoboy')
export const parseRecebidoPor = (obs?: string) => extractField(obs, 'Recebido por')
export const parseEntregue   = (obs?: string) => extractField(obs, 'Entregue')

export function parseObsUsuario(obs?: string): string | null {
  if (!obs) return null
  const sepIdx = obs.indexOf(DIVISOR)
  const parte = (sepIdx !== -1 ? obs.slice(0, sepIdx) : obs).trim()
  return parte || null
}
