import type { LIClient } from '@/clients/loja-integrada/client'
import type { LiSyncEventRepository } from './li-sync-event.repository'
import type { OrderRepository } from './order.repository'

type RawEvent = Awaited<ReturnType<LiSyncEventRepository['findPending']>>[number]

export function createLiSyncService(
  liClient: LIClient,
  liSyncEventRepository: LiSyncEventRepository,
  orderRepository: OrderRepository,
) {
  async function processEvent(event: RawEvent): Promise<void> {
    try {
      const { codigo } = event.payload as { codigo: string }
      const order = await orderRepository.findById(event.orderId)
      // olistNumero holds the LI order numero (path param used in API calls)
      // olistId holds the LI internal database ID (used only for idempotency)
      const liNumero = order?.olistNumero ? parseInt(order.olistNumero, 10) : null
      if (!liNumero) {
        console.warn('[li-sync] olistNumero ausente — ignorando evento', { eventId: event.id })
        await liSyncEventRepository.markDone(event.id)
        return
      }
      await liClient.updateOrderStatus(liNumero, codigo)
      await liSyncEventRepository.markDone(event.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[li-sync] processEvent falhou', { eventId: event.id, err: message })
      await liSyncEventRepository.markFailed(event.id, message)
    }
  }

  return {
    processAllPending: async (): Promise<void> => {
      const events = await liSyncEventRepository.findPending()
      for (const event of events) {
        await processEvent(event)
      }
    },
  }
}

export type LiSyncService = ReturnType<typeof createLiSyncService>
