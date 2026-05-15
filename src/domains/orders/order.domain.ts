import { createOlistClient } from '@/clients/olist/client'
import { createOrderRepository } from './order.repository'
import { createOlistSyncEventRepository } from './olist-sync-event.repository'
import { createOrderService } from './order.service'
import { createOlistSyncService } from './olist-sync.service'

export function createOrderDomain(tinyToken: string) {
  const olistClient = createOlistClient(tinyToken)
  const orderRepository = createOrderRepository()
  const syncEventRepository = createOlistSyncEventRepository()
  const orderService = createOrderService(orderRepository, syncEventRepository)
  const syncService = createOlistSyncService(olistClient, syncEventRepository, orderRepository)
  return { orderService, syncService }
}
