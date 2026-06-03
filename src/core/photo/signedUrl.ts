import { hmacSign, hmacVerify } from '@/core/signing'

const TTL_SECONDS = 3600

export async function signPhotoUrl(blobUrl: string): Promise<string> {
  const ts = Math.floor(Date.now() / 1000)
  const ref = Buffer.from(blobUrl).toString('base64url')
  const sig = await hmacSign(`${ref}.${ts}`)
  return `/api/admin/photo?ref=${ref}&ts=${ts}&sig=${sig}`
}

export async function verifyPhotoRef(ref: string, ts: string, sig: string): Promise<string | null> {
  const tsNum = parseInt(ts, 10)
  if (isNaN(tsNum) || Math.floor(Date.now() / 1000) - tsNum > TTL_SECONDS) return null
  const valid = await hmacVerify(`${ref}.${ts}`, sig)
  if (!valid) return null
  try {
    return Buffer.from(ref, 'base64url').toString('utf-8')
  } catch {
    return null
  }
}

const BLOB_HOST_SUFFIX = '.blob.vercel-storage.com'

export function isTrustedBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && hostname.endsWith(BLOB_HOST_SUFFIX)
  } catch {
    return false
  }
}
