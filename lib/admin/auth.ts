export type Role = 'vendas' | 'florista' | 'expedicao' | 'motoboy' | 'admin'

export const ROLES: Role[] = ['vendas', 'florista', 'expedicao', 'motoboy', 'admin']

export const ROLE_LABELS: Record<Role, string> = {
  vendas: 'Vendas',
  florista: 'Florista',
  expedicao: 'Expedição',
  motoboy: 'Motoboy',
  admin: 'Administrador',
}

export const COOKIE_NAME = '_dq'

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
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
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET não configurado')
  const sig = await sign(role, secret)
  return `${role}.${sig}`
}

export async function verifySession(cookie: string): Promise<Role | null> {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return null
  const dot = cookie.lastIndexOf('.')
  if (dot === -1) return null
  const role = cookie.slice(0, dot) as Role
  const sig = cookie.slice(dot + 1)
  if (!ROLES.includes(role)) return null
  const expected = await sign(role, secret)
  if (sig !== expected) return null
  return role
}

export function getRequestRole(request: { headers: { get(name: string): string | null } }): Role | null {
  const role = request.headers.get('x-admin-role') as Role
  if (!role || !ROLES.includes(role)) return null
  return role
}

export function canAccess(role: Role, area: string): boolean {
  return role === 'admin' || role === area
}
