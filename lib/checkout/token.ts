import { createHmac, timingSafeEqual } from 'crypto'

export interface PaymentTokenPayload {
  pedidoId: number   // ID interno do Olist (para atualizar situação)
  pedido: string     // número legível do pedido (para exibir)
  sku: string
  nome: string
  valor: number
}

interface SignedPayload extends PaymentTokenPayload {
  iat: number
}

const TTL_SECONDS = 48 * 60 * 60 // 48 horas

function secret(): string {
  const s = process.env.PAYLOAD_ENCODER_SECRET
  if (!s) throw new Error('PAYLOAD_ENCODER_SECRET não configurado')
  return s
}

export function signToken(payload: PaymentTokenPayload): string {
  const signed: SignedPayload = { ...payload, iat: Math.floor(Date.now() / 1000) }
  const encoded = Buffer.from(JSON.stringify(signed)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyToken(token: string): PaymentTokenPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const encoded = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = createHmac('sha256', secret()).update(encoded).digest('base64url')
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const { iat, ...payload } = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SignedPayload
    if (Math.floor(Date.now() / 1000) - iat > TTL_SECONDS) return null
    return payload
  } catch {
    return null
  }
}
