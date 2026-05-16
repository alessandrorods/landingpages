import { hmacSign, hmacVerify } from '@/core/signing'

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

// Session format: "displayName|username|role.hmac(displayName|username|role)"
// Constraint: displayName and username must not contain "|"
export async function createSession(displayName: string, username: string, role: Role): Promise<string> {
  const payload = `${displayName}|${username}|${role}`
  const sig = await hmacSign(payload)
  return `${payload}.${sig}`
}

export async function verifySession(cookie: string): Promise<{ displayName: string; username: string; role: Role } | null> {
  const dot = cookie.lastIndexOf('.')
  if (dot === -1) return null
  const payload = cookie.slice(0, dot)
  const sig = cookie.slice(dot + 1)
  const valid = await hmacVerify(payload, sig)
  if (!valid) return null

  const parts = payload.split('|')
  if (parts.length !== 3) return null
  const [displayName, username, role] = parts
  if (!ROLES.includes(role as Role)) return null

  return { displayName, username, role: role as Role }
}

export function getRequestRole(request: { headers: { get(name: string): string | null } }): Role | null {
  const role = request.headers.get('x-admin-role') as Role
  if (!role || !ROLES.includes(role)) return null
  return role
}

export function getRequestUsername(request: { headers: { get(name: string): string | null } }): string | null {
  return request.headers.get('x-admin-username')
}

export function getRequestDisplayName(request: { headers: { get(name: string): string | null } }): string | null {
  return request.headers.get('x-admin-displayname')
}
