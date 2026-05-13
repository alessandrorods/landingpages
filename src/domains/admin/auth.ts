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

export async function createSession(role: Role): Promise<string> {
  const sig = await hmacSign(role)
  return `${role}.${sig}`
}

export async function verifySession(cookie: string): Promise<Role | null> {
  const dot = cookie.lastIndexOf('.')
  if (dot === -1) return null
  const role = cookie.slice(0, dot) as Role
  const sig = cookie.slice(dot + 1)
  if (!ROLES.includes(role)) return null
  const valid = await hmacVerify(role, sig)
  return valid ? role : null
}

export function getRequestRole(request: { headers: { get(name: string): string | null } }): Role | null {
  const role = request.headers.get('x-admin-role') as Role
  if (!role || !ROLES.includes(role)) return null
  return role
}

export function canAccess(role: Role, area: string): boolean {
  return role === 'admin' || role === area
}
