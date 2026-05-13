import type { Role } from './auth'
import { ROLES } from './auth'

export const AREA_ACCESS: Record<string, readonly Role[]> = {
  vendas:    ['vendas', 'admin'],
  florista:  ['florista', 'admin'],
  expedicao: ['expedicao', 'admin'],
  motoboy:   ['motoboy', 'admin'],
  painel:    ['admin'],
  users:     ['admin'],
}

export const AREA_LABELS: Record<string, string> = {
  vendas:    'Vendas',
  florista:  'Florista',
  expedicao: 'Expedição',
  motoboy:   'Motoboy',
  painel:    'Painel',
  users:     'Usuários',
}

export const PERMISSIONS = {
  viewOrders:        ROLES,
  collectOrder:      ROLES,
  deliverOrder:      ROLES,
  searchOrders:      ['vendas', 'expedicao', 'admin'],
  createOrder:       ['vendas', 'admin'],
  updateOrderStatus: ['florista', 'expedicao', 'admin'],
  dispatchOrder:     ['admin'],
  searchProducts:    ['vendas', 'admin'],
  manageUsers:       ['admin'],
} as const satisfies Record<string, readonly Role[]>

export type Permission = keyof typeof PERMISSIONS

export function can(role: Role | null, permission: Permission): boolean {
  if (!role) return false
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}
