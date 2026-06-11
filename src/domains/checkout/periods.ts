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

function getBRTNow(): { dateISO: string; minutes: number } {
  const now = new Date()
  const dateISO = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const timeStr = now.toLocaleTimeString('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const [h, m] = timeStr.split(':').map(Number)
  return { dateISO, minutes: h * 60 + m }
}

// Determines if a period can be selected for a given delivery date (yyyy-mm-dd).
// Future dates allow all periods; for today, the period must close after now + preparation time.
export function isPeriodAvailableForDate(
  period: PeriodoEntrega,
  preparationMinutes: number,
  deliveryDateISO: string,
): boolean {
  const { dateISO: todayISO, minutes: nowMinutes } = getBRTNow()
  if (deliveryDateISO !== todayISO) return true

  const [h, m] = period.deliveryLimitHour.split(':').map(Number)
  const limitMinutes = h * 60 + m
  const cutoffMinutes = limitMinutes - preparationMinutes
  return nowMinutes < cutoffMinutes
}
