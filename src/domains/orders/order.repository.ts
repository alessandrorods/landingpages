import prisma from '@/core/db/client'
import type { CreateOrderInput, OrderStatus } from './order.types'

function parseDeliveryDate(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
}

const includeItems = { items: true } as const

export function createOrderRepository() {
  return {
    create: (input: CreateOrderInput) =>
      prisma.order.create({
        data: {
          payment: input.payment,
          freight: input.freight,
          notes: input.notes ?? null,
          buyerName: input.buyerName,
          buyerPhone: input.buyerPhone,
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          cardMessage: input.cardMessage ?? null,
          zipCode: input.zipCode,
          street: input.street,
          streetNumber: input.streetNumber,
          complement: input.complement ?? null,
          neighborhood: input.neighborhood,
          deliveryDate: parseDeliveryDate(input.deliveryDate),
          deliveryPeriod: input.deliveryPeriod,
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

    findByStatus: (status: OrderStatus) =>
      prisma.order.findMany({
        where: { status },
        include: includeItems,
        orderBy: { deliveryDate: 'asc' },
      }),

    findByNumero: (numero: string) =>
      prisma.order.findFirst({
        where: { olistNumero: numero },
        include: includeItems,
      }),

    updateOlistRef: (id: number, olistId: number, olistNumero: string) =>
      prisma.order.update({ where: { id }, data: { olistId, olistNumero } }),

    updateStatus: (id: number, status: OrderStatus) =>
      prisma.order.update({ where: { id }, data: { status } }),

    updateDispatch: (id: number, data: { courierName: string; dispatchedAt: Date }) =>
      prisma.order.update({ where: { id }, data }),

    updateDelivery: (id: number, data: { deliveredAt: Date; receivedBy: string; courierName: string }) =>
      prisma.order.update({ where: { id }, data }),

    updateMpPreferenceId: (id: number, mpPreferenceId: string) =>
      prisma.order.update({ where: { id }, data: { mpPreferenceId } }),
  }
}

export type OrderRepository = ReturnType<typeof createOrderRepository>
