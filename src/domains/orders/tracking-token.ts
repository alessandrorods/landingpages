import { hmacSign, hmacVerify } from '@/core/signing'

/**
 * Generates an opaque tracking token for an order ID.
 * Format: base64url(id).<hmac> — same pattern as checkout/token.ts.
 * The page decodes the token to recover the order ID without any DB lookup.
 */
const SIG_LENGTH = 32 // 16 bytes = 128 bits — enough to prevent enumeration

export async function signTrackingToken(id: number): Promise<string> {
  const encoded = Buffer.from(String(id)).toString('base64url')
  const sig = (await hmacSign(encoded)).slice(0, SIG_LENGTH)
  return `${encoded}.${sig}`
}

/**
 * Verifies the token and returns the order ID, or null if invalid/tampered.
 */
export async function verifyTrackingToken(token: string): Promise<number | null> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const encoded = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    if (sig.length !== SIG_LENGTH) return null
    const fullSig = await hmacSign(encoded)
    if (fullSig.slice(0, SIG_LENGTH) !== sig) return null
    const id = parseInt(Buffer.from(encoded, 'base64url').toString(), 10)
    return isNaN(id) ? null : id
  } catch {
    return null
  }
}
