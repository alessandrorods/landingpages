import prisma from '@/core/db/client'
import type { CreateOrderInput, OrderStatus } from './order.types'

function parseDeliveryDate(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
}

function startOfTodaySP(): Date {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  return new Date(`${todayStr}T03:00:00.000Z`)
}

const includeItems = { items: true, courier: true } as const

export function createOrderRepository() {
  return {
    create: (input: CreateOrderInput) =>
      prisma.order.create({
        data: {
          pickup: input.pickup,
          payment: input.payment,
          freight: input.pickup ? 0 : input.freight,
          notes: input.notes ?? null,
          buyerName: input.buyerName,
          buyerPhone: input.buyerPhone,
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          cardMessage: input.cardMessage ?? null,
          zipCode: input.zipCode ?? null,
          street: input.street ?? null,
          streetNumber: input.streetNumber ?? null,
          complement: input.complement ?? null,
          neighborhood: input.neighborhood ?? null,
          deliveryDate: parseDeliveryDate(input.deliveryDate),
          deliveryPeriod: input.deliveryPeriod ?? null,
          source: input.source,
          items: {
            create: input.items.map((i) => ({
              sku: i.sku ?? null,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
          },
        },
        include: includeItems,
      }),

    findById: (id: number) =>
      prisma.order.findUnique({ where: { id }, include: includeItems }),

    findByStatus: (status: OrderStatus, courierId?: string) =>
      prisma.order.findMany({
        where: { status, ...(courierId ? { courierId } : {}) },
        include: includeItems,
        orderBy: { deliveryDate: 'asc' },
      }),

    findReadyForDispatch: () =>
      prisma.order.findMany({
        where: { status: 'ready', pickup: false },
        include: includeItems,
        orderBy: { createdAt: 'asc' },
      }),

    findByNumero: (numero: string) =>
      prisma.order.findFirst({
        where: { olistNumero: numero },
        include: includeItems,
      }),

    findDeliveredTodayByCourier: (courierId: string) =>
      prisma.order.findMany({
        where: {
          courierId,
          status: 'delivered',
          historyEntries: {
            some: {
              action: 'delivered',
              createdAt: { gte: startOfTodaySP() },
            },
          },
        },
        include: includeItems,
        orderBy: { updatedAt: 'desc' },
      }),

    updateOlistRef: (id: number, olistId: number, olistNumero: string) =>
      prisma.order.update({ where: { id }, data: { olistId, olistNumero } }),

    updateStatus: (id: number, status: OrderStatus) =>
      prisma.order.update({ where: { id }, data: { status } }),

    updateDispatch: (id: number, data: { courierId: string }) =>
      prisma.order.update({ where: { id }, data }),

    updateDelivery: (id: number, data: { courierId: string }) =>
      prisma.order.update({ where: { id }, data }),

    updateMpPreferenceId: (id: number, mpPreferenceId: string) =>
      prisma.order.update({ where: { id }, data: { mpPreferenceId } }),

    findPublicStatus: (id: number) =>
      prisma.order.findUnique({
        where: { id },
        select: { status: true, pickup: true, createdAt: true },
      }),
  }
}

export type OrderRepository = ReturnType<typeof createOrderRepository>
