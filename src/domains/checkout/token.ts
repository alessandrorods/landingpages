import { hmacSign, hmacVerify } from '@/core/signing'

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

/** Serializes the payload as base64url and signs it with HMAC. Returns `<encoded>.<sig>` for use as a query param in the payment confirmation URL. */
export async function signToken(payload: PaymentTokenPayload): Promise<string> {
  const signed: SignedPayload = { ...payload, iat: Math.floor(Date.now() / 1000) }
  const encoded = Buffer.from(JSON.stringify(signed)).toString('base64url')
  const sig = await hmacSign(encoded)
  return `${encoded}.${sig}`
}

/** Verifies the token signature and TTL. Returns the payload if valid, `null` if invalid, tampered or expired. */
export async function verifyToken(token: string): Promise<PaymentTokenPayload | null> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const encoded = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    if (!await hmacVerify(encoded, sig)) return null
    const { iat, ...payload } = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as SignedPayload
    if (Math.floor(Date.now() / 1000) - iat > TTL_SECONDS) return null
    return payload
  } catch {
    return null
  }
}
