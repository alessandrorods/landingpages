import prisma from '@/core/db/client'

const MAX_ATTEMPTS = 5

export function createLiSyncEventRepository() {
  return {
    create: (orderId: number, type: 'status_updated', payload: object) =>
      prisma.liSyncEvent.create({ data: { orderId, type, payload } }),

    findPending: () =>
      prisma.liSyncEvent.findMany({
        where: { status: 'pending', attempts: { lt: MAX_ATTEMPTS } },
        orderBy: [{ orderId: 'asc' }, { createdAt: 'asc' }],
      }),

    markDone: (id: number) =>
      prisma.liSyncEvent.update({
        where: { id },
        data: { status: 'done', processedAt: new Date() },
      }),

    markFailed: (id: number, error: string) =>
      prisma.liSyncEvent.update({
        where: { id },
        data: { status: 'failed', lastError: error, attempts: { increment: 1 } },
      }),
  }
}

export type LiSyncEventRepository = ReturnType<typeof createLiSyncEventRepository>
