import { createOlistClient } from '@/clients/olist/client'
import { createOrderRepository } from './order.repository'
import { createOlistSyncEventRepository } from './olist-sync-event.repository'
import { createOrderHistoryRepository } from './order-history.repository'
import { createOrderService } from './order.service'
import { createOlistSyncService } from './olist-sync.service'
import { withOrderHistory } from './order-history.decorator'

export function createOrderDomain(tinyToken: string) {
  const olistClient = createOlistClient(tinyToken)
  const orderRepository = createOrderRepository()
  const syncEventRepository = createOlistSyncEventRepository()
  const historyRepository = createOrderHistoryRepository()

  const rawService = createOrderService(orderRepository, syncEventRepository)
  const orderService = withOrderHistory(rawService, historyRepository)
  const syncService = createOlistSyncService(olistClient, syncEventRepository, orderRepository)

  return { orderService, syncService }
}
