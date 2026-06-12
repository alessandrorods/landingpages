import type { OrderDTO } from './order.types'
import type { ExternalDispatchOrderDTO } from './external-order.types'
import type { DeliveryRegion } from '@/domains/config/config.types'

export type { DeliveryRegion }

export type QueueOrder = OrderDTO | ExternalDispatchOrderDTO

export function isExternalOrder(order: QueueOrder): order is ExternalDispatchOrderDTO {
  return 'platform' in order
}

interface PeriodInfo {
  id: string
  label: string
  deliveryLimitHour: string
}

export interface QueueGroup {
  key: string
  date: string
  period: string
  periodLabel: string
  deliveryLimitHour: string | null  // HH:MM or null if period unknown
  region: string
  regionLabel: string
  orders: QueueOrder[]
}

export function resolveRegion(
  zipCode: string | null,
  regions: DeliveryRegion[],
): { region: string; regionLabel: string } {
  if (!zipCode || regions.length === 0) {
    return { region: 'unknown', regionLabel: 'Região não identificada' }
  }
  const clean = zipCode.replace(/\D/g, '').padEnd(8, '0').slice(0, 8)
  const match = regions.find((r) =>
    r.zipRanges.some((z) => clean >= z.zipStart && clean <= z.zipEnd)
  )
  return match
    ? { region: match.region, regionLabel: match.label }
    : { region: 'unknown', regionLabel: 'Região não identificada' }
}

export function buildDispatchQueue(
  orders: QueueOrder[],
  regions: DeliveryRegion[],
  periods: PeriodInfo[],
): QueueGroup[] {
  const periodMap = new Map(periods.map((p) => [p.id, p]))
  const groups = new Map<string, QueueGroup>()

  for (const order of orders) {
    const { region, regionLabel } = resolveRegion(order.zipCode, regions)
    const periodId = order.deliveryPeriod ?? ''
    const periodInfo = periodMap.get(periodId)
    const key = `${order.deliveryDate}|${periodId}|${region}`

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: order.deliveryDate,
        period: periodId,
        periodLabel: periodInfo?.label ?? periodId,
        deliveryLimitHour: periodInfo?.deliveryLimitHour ?? null,
        region,
        regionLabel,
        orders: [],
      })
    }
    groups.get(key)!.orders.push(order)
  }

  for (const group of groups.values()) {
    group.orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  const toSortable = (ddmmyyyy: string) => ddmmyyyy.split('/').reverse().join('')

  return [...groups.values()].sort((a, b) => {
    const dateCmp = toSortable(a.date).localeCompare(toSortable(b.date))
    if (dateCmp !== 0) return dateCmp
    // null deliveryLimitHour goes last
    const aHour = a.deliveryLimitHour ?? '99:99'
    const bHour = b.deliveryLimitHour ?? '99:99'
    const hourCmp = aHour.localeCompare(bHour)
    if (hourCmp !== 0) return hourCmp
    return b.orders.length - a.orders.length
  })
}
