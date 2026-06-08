import { createOlistClient } from '@/clients/olist/client'
import { createLIClient } from '@/clients/loja-integrada/client'
import { createOrderRepository } from './order.repository'
import { createOlistSyncEventRepository } from './olist-sync-event.repository'
import { createLiSyncEventRepository } from './li-sync-event.repository'
import { createOrderHistoryRepository } from './order-history.repository'
import { createOrderService } from './order.service'
import { createOlistSyncService, type OlistSyncService } from './olist-sync.service'
import { createLiSyncService, type LiSyncService } from './li-sync.service'
import { withOrderHistory } from './order-history.decorator'

type OrderDomainWithSync = {
  orderService: ReturnType<typeof withOrderHistory>
  syncService: OlistSyncService
  liSyncService: LiSyncService
}
type OrderDomainWithoutSync = {
  orderService: ReturnType<typeof withOrderHistory>
  syncService: null
  liSyncService: null
}

export function createOrderDomain(tinyToken: string): OrderDomainWithSync
export function createOrderDomain(tinyToken?: undefined): OrderDomainWithoutSync
export function createOrderDomain(tinyToken?: string): OrderDomainWithSync | OrderDomainWithoutSync {
  const orderRepository = createOrderRepository()
  const syncEventRepository = createOlistSyncEventRepository()
  const liSyncEventRepository = createLiSyncEventRepository()
  const historyRepository = createOrderHistoryRepository()

  const rawService = createOrderService(orderRepository, syncEventRepository, liSyncEventRepository)
  const orderService = withOrderHistory(rawService, historyRepository)

  if (!tinyToken) {
    return { orderService, syncService: null, liSyncService: null }
  }

  const syncService = createOlistSyncService(createOlistClient(tinyToken), syncEventRepository, orderRepository)

  const chaveApi = process.env.LI_CHAVE_API ?? ''
  const chaveAplicacao = process.env.LI_CHAVE_APLICACAO ?? ''
  const liSyncService = createLiSyncService(
    createLIClient(chaveApi, chaveAplicacao),
    liSyncEventRepository,
    orderRepository,
  )

  return { orderService, syncService, liSyncService }
}
