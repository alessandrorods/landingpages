import prisma from '@/core/db/client'
import type { Actor, OrderHistoryAction } from './order.types'

export function createOrderHistoryRepository() {
  return {
    record: (
      orderId: number,
      action: OrderHistoryAction,
      actor: Actor,
      metadata?: Record<string, string>,
    ) =>
      prisma.orderHistoryEntry.create({
        data: {
          orderId,
          action,
          actorType: actor.type,
          actorName: actor.name,
          metadata: metadata ?? undefined,
        },
      }),

    findByOrderId: (orderId: number) =>
      prisma.orderHistoryEntry.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' },
      }),
  }
}

export type OrderHistoryRepository = ReturnType<typeof createOrderHistoryRepository>
