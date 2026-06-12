import { fmtDate } from './order.service'
import type { ExternalDispatchOrderRepository } from './external-order.repository'
import type { CreateExternalDispatchOrderInput, ExternalDispatchOrderDTO, ExternalPlatform } from './external-order.types'

type PrismaExternalDispatchOrder = Awaited<ReturnType<ExternalDispatchOrderRepository['create']>>

function toExternalDispatchOrderDTO(row: PrismaExternalDispatchOrder): ExternalDispatchOrderDTO {
  return {
    id: row.id,
    platform: row.platform as ExternalPlatform,
    externalNumber: row.externalNumber,
    zipCode: row.zipCode,
    neighborhood: row.neighborhood,
    deliveryDate: fmtDate(row.deliveryDate),
    deliveryPeriod: row.deliveryPeriod,
    createdAt: row.scheduledAt.toISOString(),
  }
}

export function createExternalDispatchOrderService(repository: ExternalDispatchOrderRepository) {
  return {
    async create(input: CreateExternalDispatchOrderInput): Promise<ExternalDispatchOrderDTO> {
      const row = await repository.create(input)
      return toExternalDispatchOrderDTO(row)
    },

    async listUpcoming(): Promise<ExternalDispatchOrderDTO[]> {
      const rows = await repository.findUpcoming()
      return rows.map(toExternalDispatchOrderDTO)
    },

    async dispatch(id: number, courierId: string): Promise<void> {
      await repository.dispatch(id, courierId)
    },
  }
}

export type ExternalDispatchOrderService = ReturnType<typeof createExternalDispatchOrderService>
