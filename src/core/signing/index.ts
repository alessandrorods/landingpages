// Web Crypto API — works in both Node.js and Edge runtimes.
// This is the single source of truth for all cryptographic operations in the app.
// Consumers call these functions without knowing the secret or the algorithm.

function getSecret(): string {
  const s = process.env.SECRET_KEY
  if (!s) throw new Error('SECRET_KEY not configured')
  return s
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Signs arbitrary data with HMAC-SHA256 using the app secret. Returns a hex digest. */
export async function hmacSign(data: string): Promise<string> {
  const key = await importKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return bytesToHex(sig)
}

/**
 * Verifies a hex digest against the expected HMAC of the given data.
 * Uses a constant-time XOR comparison to prevent timing attacks.
 */
export async function hmacVerify(data: string, hash: string): Promise<boolean> {
  const expected = await hmacSign(data)
  if (hash.length !== expected.length) return false
  let mismatch = 0
  for (let i = 0; i < hash.length; i++) {
    mismatch |= hash.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return mismatch === 0
}

