import { createOrderRepository } from './order.repository'
import type { OrderStatus } from './order.types'

export interface PublicTrackingData {
  status: OrderStatus
  pickup: boolean
  createdAt: Date
}

export async function getPublicOrderStatus(id: number): Promise<PublicTrackingData | null> {
  const row = await createOrderRepository().findPublicStatus(id)
  if (!row) return null
  return {
    status: row.status as OrderStatus,
    pickup: row.pickup,
    createdAt: row.createdAt,
  }
}
