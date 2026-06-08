import prisma from '@/core/db/client'

const MAX_ATTEMPTS = 5

export function createOlistSyncEventRepository() {
  return {
    create: (orderId: number, type: 'order_created' | 'status_updated', payload: object) =>
      prisma.olistSyncEvent.create({ data: { orderId, type, payload } }),

    findPending: () =>
      prisma.olistSyncEvent.findMany({
        where: { status: 'pending', attempts: { lt: MAX_ATTEMPTS } },
        orderBy: [{ orderId: 'asc' }, { createdAt: 'asc' }],
      }),

    findPendingForOrder: (orderId: number) =>
      prisma.olistSyncEvent.findMany({
        where: { orderId, status: 'pending', attempts: { lt: MAX_ATTEMPTS } },
        orderBy: { createdAt: 'asc' },
      }),

    markDone: (id: number) =>
      prisma.olistSyncEvent.update({
        where: { id },
        data: { status: 'done', processedAt: new Date() },
      }),

    markFailed: (id: number, error: string) =>
      prisma.olistSyncEvent.update({
        where: { id },
        data: { status: 'failed', lastError: error, attempts: { increment: 1 } },
      }),
  }
}

export type OlistSyncEventRepository = ReturnType<typeof createOlistSyncEventRepository>
