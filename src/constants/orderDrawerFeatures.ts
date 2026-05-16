import type { Role } from '@/domains/admin/auth'

export const ORDER_DRAWER_FEATURES = {
  olistBadge:       ['vendas', 'florista', 'expedicao', 'admin'],
  historyPanel:     ['vendas', 'florista', 'expedicao', 'admin'],
  printButton:      ['vendas', 'florista', 'expedicao', 'admin'],
  confirmationCopy: ['vendas', 'admin'],
  createdAt:        ['vendas', 'florista', 'expedicao', 'admin'],
  buyerInfo:        ['vendas', 'florista', 'expedicao', 'admin'],
  navigation:       ['motoboy', 'admin'],
  itemPrices:       ['vendas', 'florista', 'expedicao', 'admin'],
  cardMessage:      ['vendas', 'florista', 'admin'],
  freightAmount:    ['vendas', 'expedicao', 'admin'],
  orderTotal:       ['vendas', 'admin'],
} as const satisfies Record<string, readonly Role[]>

export type OrderDrawerFeature = keyof typeof ORDER_DRAWER_FEATURES

export function canSeeDrawerFeature(role: Role | null, feature: OrderDrawerFeature): boolean {
  if (!role) return false
  return (ORDER_DRAWER_FEATURES[feature] as readonly string[]).includes(role)
}
