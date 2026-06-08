import type { PeriodoEntrega } from '@/constants/pedido.types'

export function isPeriodAvailable(
  period: PeriodoEntrega,
  preparationMinutes: number,
  now = new Date(),
): boolean {
  const [h, m] = period.deliveryLimitHour.split(':').map(Number)
  const limitMinutes = h * 60 + m
  const cutoffMinutes = limitMinutes - preparationMinutes
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes < cutoffMinutes
}
