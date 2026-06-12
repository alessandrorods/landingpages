import prisma from '@/core/db/client'
import type { CreateExternalDispatchOrderInput } from './external-order.types'

function parseDeliveryDate(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
}

function parseScheduledAt(ddmmyyyy: string, hhmm: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  const [hh, min] = hhmm.split(':')
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00.000-03:00`)
}

function startOfTodaySP(): Date {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  return new Date(`${todayStr}T03:00:00.000Z`)
}

export function createExternalDispatchOrderRepository() {
  return {
    create: (input: CreateExternalDispatchOrderInput) =>
      prisma.externalDispatchOrder.create({
        data: {
          platform: input.platform,
          externalNumber: input.externalNumber,
          zipCode: input.zipCode ?? null,
          neighborhood: input.neighborhood ?? null,
          deliveryDate: parseDeliveryDate(input.deliveryDate),
          deliveryPeriod: input.deliveryPeriod ?? null,
          scheduledAt: parseScheduledAt(input.deliveryDate, input.scheduledTime),
        },
      }),

    findUpcoming: () =>
      prisma.externalDispatchOrder.findMany({
        where: { deliveryDate: { gte: startOfTodaySP() } },
        orderBy: { scheduledAt: 'asc' },
      }),
  }
}

export type ExternalDispatchOrderRepository = ReturnType<typeof createExternalDispatchOrderRepository>
