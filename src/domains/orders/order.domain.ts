import { createOlistClient } from '@/clients/olist/client'
import { createOrderRepository } from './order.repository'
import { createOlistSyncEventRepository } from './olist-sync-event.repository'
import { createOrderHistoryRepository } from './order-history.repository'
import { createOrderService } from './order.service'
import { createOlistSyncService, type OlistSyncService } from './olist-sync.service'
import { withOrderHistory } from './order-history.decorator'

type OrderDomainWithSync = { orderService: ReturnType<typeof withOrderHistory>; syncService: OlistSyncService }
type OrderDomainWithoutSync = { orderService: ReturnType<typeof withOrderHistory>; syncService: null }

export function createOrderDomain(tinyToken: string): OrderDomainWithSync
export function createOrderDomain(tinyToken?: undefined): OrderDomainWithoutSync
export function createOrderDomain(tinyToken?: string): OrderDomainWithSync | OrderDomainWithoutSync {
  const orderRepository = createOrderRepository()
  const syncEventRepository = createOlistSyncEventRepository()
  const historyRepository = createOrderHistoryRepository()

  const rawService = createOrderService(orderRepository, syncEventRepository)
  const orderService = withOrderHistory(rawService, historyRepository)

  const syncService = tinyToken
    ? createOlistSyncService(createOlistClient(tinyToken), syncEventRepository, orderRepository)
    : null

  return { orderService, syncService }
}
