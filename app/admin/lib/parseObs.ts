const DIVISOR = '\n---\n'
const LI_HEADER = '------------------\nDADOS DA ENTREGA:'

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

// ─── Loja Integrada ───────────────────────────────────────────────────────────

export function isOrderFromLI(obs_interna?: string): boolean {
  return !!obs_interna?.includes(LI_HEADER)
}

export interface LIParsedData {
  recipientName?: string
  scheduledDelivery?: string
  cardMessage?: string
  observations?: string
}

export function parseLIData(obs_interna?: string): LIParsedData | null {
  if (!isOrderFromLI(obs_interna)) return null

  const lines = obs_interna!.split('\n')
  const kv = lines.reduce<Record<string, string>>((acc, line) => {
    const sep = line.indexOf(': ')
    if (sep > -1) {
      const key = line.substring(0, sep).trim()
      const val = line.substring(sep + 2).trim()
      if (key) acc[key] = val
    }
    return acc
  }, {})

  let cardMessage: string | undefined
  if (obs_interna!.includes('Mensagem no Cartão:')) {
    const [, after] = obs_interna!.split('Mensagem no Cartão:')
    const [msg] = after.split('------------------')
    cardMessage = msg?.trim() || undefined
  }

  let observations: string | undefined
  if (obs_interna!.includes('OBSERVAÇÕES DO PEDIDO:\n')) {
    const [, after] = obs_interna!.split('OBSERVAÇÕES DO PEDIDO:\n')
    observations = after?.replace(/------------------/g, '').trim() || undefined
  }

  return {
    recipientName: kv['Entregar para'],
    scheduledDelivery: kv['Entrega agendada para'],
    cardMessage,
    observations,
  }
}
