import prisma from '@/core/db/client'
import type { CreateOrderInput, UpdateOrderInput, OrderStatus } from './order.types'

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

    findByNumero: (numero: string) => {
      const asId = parseInt(numero, 10)
      return prisma.order.findFirst({
        where: {
          OR: [
            { olistNumero: numero },
            ...(Number.isFinite(asId) ? [{ id: asId }] : []),
          ],
        },
        include: includeItems,
      })
    },

    findDeliveredToday: () =>
      prisma.order.findMany({
        where: {
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

    clearCourier: (id: number) =>
      prisma.order.update({ where: { id }, data: { courierId: null } }),

    updateDeliverySchedule: (id: number, deliveryDate: string, deliveryPeriod: string | null) =>
      prisma.order.update({
        where: { id },
        data: {
          deliveryDate: parseDeliveryDate(deliveryDate),
          deliveryPeriod,
        },
      }),

    updateMpPreferenceId: (id: number, mpPreferenceId: string) =>
      prisma.order.update({ where: { id }, data: { mpPreferenceId } }),

    updateOrder: (id: number, data: UpdateOrderInput) =>
      prisma.$transaction([
        prisma.order.update({
          where: { id },
          data: {
            buyerName:     data.buyerName,
            buyerPhone:    data.buyerPhone,
            recipientName: data.recipientName,
            recipientPhone: data.recipientPhone,
            cardMessage:   data.cardMessage ?? null,
            zipCode:       data.zipCode ?? null,
            street:        data.street ?? null,
            streetNumber:  data.streetNumber ?? null,
            complement:    data.complement ?? null,
            neighborhood:  data.neighborhood ?? null,
            deliveryDate:  parseDeliveryDate(data.deliveryDate),
            deliveryPeriod: data.deliveryPeriod ?? null,
            freight:       data.freight,
            notes:         data.notes ?? null,
          },
        }),
        prisma.orderItem.deleteMany({ where: { orderId: id } }),
        prisma.orderItem.createMany({
          data: data.items.map((i) => ({
            orderId:  id,
            sku:      i.sku ?? null,
            name:     i.name,
            price:    i.price,
            quantity: i.quantity,
          })),
        }),
      ]),

    findByOlistId: (olistId: number) =>
      prisma.order.findUnique({ where: { olistId }, include: includeItems }),

    updateOlistRefAndStatus: (id: number, olistId: number, olistNumero: string, status: OrderStatus) =>
      prisma.order.update({ where: { id }, data: { olistId, olistNumero, status } }),

    findPublicStatus: (id: number) =>
      prisma.order.findUnique({
        where: { id },
        select: { status: true, pickup: true, createdAt: true },
      }),
  }
}

export type OrderRepository = ReturnType<typeof createOrderRepository>
