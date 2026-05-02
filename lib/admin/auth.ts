export type Role = 'vendas' | 'florista' | 'expedicao' | 'admin'

export const ROLES: Role[] = ['vendas', 'florista', 'expedicao', 'admin']

export const ROLE_LABELS: Record<Role, string> = {
  vendas: 'Vendas',
  florista: 'Florista',
  expedicao: 'Expedição',
  admin: 'Administrador',
}

export const COOKIE_NAME = '_dq'

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'dev-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSession(role: Role): Promise<string> {
  const sig = await sign(role, process.env.ADMIN_SECRET ?? '')
  return `${role}.${sig}`
}

export async function verifySession(cookie: string): Promise<Role | null> {
  const dot = cookie.lastIndexOf('.')
  if (dot === -1) return null
  const role = cookie.slice(0, dot) as Role
  const sig = cookie.slice(dot + 1)
  if (!ROLES.includes(role)) return null
  const expected = await sign(role, process.env.ADMIN_SECRET ?? '')
  if (sig !== expected) return null
  return role
}

export function canAccess(role: Role, area: string): boolean {
  return role === 'admin' || role === area
}
