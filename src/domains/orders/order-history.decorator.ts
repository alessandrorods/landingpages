import type { OrderService } from './order.service'
import type { OrderHistoryRepository } from './order-history.repository'
import type { Actor, CreateOrderInput, OrderHistoryAction, OrderStatus } from './order.types'

export function withOrderHistory(service: OrderService, historyRepository: OrderHistoryRepository) {
  return {
    async createOrder(input: CreateOrderInput, actor: Actor) {
      const order = await service.createOrder(input)
      await historyRepository.record(order.id, 'created', actor, { source: input.source })
      return order
    },

    async updateStatus(id: number, status: OrderStatus, actor: Actor) {
      await service.updateStatus(id, status)
      await historyRepository.record(id, status as OrderHistoryAction, actor)
    },

    async dispatch(id: number, courierName: string, actor: Actor) {
      await service.dispatch(id, courierName)
      await historyRepository.record(id, 'dispatched', actor, { courierName })
    },

    async deliver(id: number, receivedBy: string, courierName: string, actor: Actor) {
      await service.deliver(id, receivedBy, courierName)
      await historyRepository.record(id, 'delivered', actor, { courierName, receivedBy })
    },

    async approveFromPayment(orderId: number, actor: Actor) {
      const transitioned = await service.approveFromPayment(orderId)
      if (transitioned) await historyRepository.record(orderId, 'approved', actor)
    },

    // Pass-throughs — sem efeito colateral de histórico
    listByStatus: service.listByStatus.bind(service),
    getById:      service.getById.bind(service),
    findByNumero: service.findByNumero.bind(service),
    setMpPreferenceId: service.setMpPreferenceId.bind(service),
  }
}

export type TrackedOrderService = ReturnType<typeof withOrderHistory>
