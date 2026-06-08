export interface ParsedObs {
  recipientName: string | null
  deliveryDate: string | null   // DD/MM/YYYY
  cardMessage: string | null
  notes: string | null
}

const SEPARATOR = '------------------'

function extractSection(text: string, afterLabel: string, untilLabel?: string): string | null {
  const startIdx = text.indexOf(afterLabel)
  if (startIdx === -1) return null
  const afterStart = text.slice(startIdx + afterLabel.length)
  const end = untilLabel ? afterStart.indexOf(untilLabel) : -1
  const raw = end !== -1 ? afterStart.slice(0, end) : afterStart
  return raw.trim() || null
}

function parseDeliveryDate(line: string): string | null {
  const match = line.match(/\((\d{2})\/(\d{2})\)/)
  if (!match) return null
  const day = match[1]
  const month = match[2]
  const now = new Date()
  const year = now.getFullYear()
  const candidate = new Date(`${year}-${month}-${day}T00:00:00.000Z`)
  const finalYear = candidate < now ? year + 1 : year
  return `${day}/${month}/${finalYear}`
}

export function parseClienteObs(obs: string | null): ParsedObs {
  if (!obs) return { recipientName: null, deliveryDate: null, cardMessage: null, notes: null }

  let recipientName: string | null = null
  let deliveryDate: string | null = null
  let cardMessage: string | null = null
  let notes: string | null = null

  for (const line of obs.split('\n')) {
    const trimmed = line.trim()

    if (trimmed.startsWith('Entregar para:')) {
      recipientName = trimmed.replace('Entregar para:', '').trim() || null
      continue
    }

    if (trimmed.startsWith('Entrega agendada para:')) {
      deliveryDate = parseDeliveryDate(trimmed)
      continue
    }
  }

  // card message: everything between "Mensagem no Cartão:" and the next separator
  const cardStart = obs.indexOf('Mensagem no Cartão:')
  if (cardStart !== -1) {
    const afterCard = obs.slice(cardStart + 'Mensagem no Cartão:'.length)
    const sepIdx = afterCard.indexOf(SEPARATOR)
    const raw = sepIdx !== -1 ? afterCard.slice(0, sepIdx) : afterCard
    cardMessage = raw.trim() || null
  }

  // notes: everything after "OBSERVAÇÕES DO PEDIDO:" until end or separator
  const obsSection = extractSection(obs, 'OBSERVAÇÕES DO PEDIDO:', SEPARATOR)
  notes = obsSection

  return { recipientName, deliveryDate, cardMessage, notes }
}
