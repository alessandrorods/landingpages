import type { OlistClient } from '@/clients/olist/client'
import type { CreateOrderInput, OrderStatus } from './order.types'
import type { OlistSyncEventRepository } from './olist-sync-event.repository'
import type { OrderRepository } from './order.repository'

type RawEvent = Awaited<ReturnType<OlistSyncEventRepository['findPending']>>[number]

export function createOlistSyncService(
  olistClient: OlistClient,
  syncEventRepository: OlistSyncEventRepository,
  orderRepository: OrderRepository,
) {
  async function processEvent(event: RawEvent): Promise<void> {
    try {
      if (event.type === 'order_created') {
        const input = event.payload as unknown as CreateOrderInput
        const ref = await olistClient.createOrderFromDomain(event.orderId, input)
        if (ref) await orderRepository.updateOlistRef(event.orderId, ref.id, ref.numero)
        await syncEventRepository.markDone(event.id)
        return
      }

      if (event.type === 'status_updated') {
        const { status } = event.payload as { status: OrderStatus }
        const order = await orderRepository.findById(event.orderId)
        if (!order?.olistId) {
          // order_created event hasn't synced yet — defer, do not count as failure
          return
        }
        await olistClient.syncStatus(order.olistId, status)
        await syncEventRepository.markDone(event.id)
        return
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[olist-sync] processEvent falhou', { eventId: event.id, type: event.type, err: message })
      await syncEventRepository.markFailed(event.id, message)
    }
  }

  return {
    processPendingFor: async (orderId: number): Promise<void> => {
      const events = await syncEventRepository.findPendingForOrder(orderId)
      for (const event of events) {
        await processEvent(event)
      }
    },

    processAllPending: async (): Promise<void> => {
      const events = await syncEventRepository.findPending()
      for (const event of events) {
        await processEvent(event)
      }
    },
  }
}

export type OlistSyncService = ReturnType<typeof createOlistSyncService>
