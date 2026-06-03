import prisma from '@/core/db/client'

const TEST_PHONE = /^11999990\d{3}$/

function parseDate(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const today = addDays(0)
const tomorrow = addDays(1)

// IDs must match the deliveryPeriods configured in system_config
const ORDERS = [
  // Hoje — manhã-i — Mogi Leste (0871…)
  { recipientName: 'Ana Paula Ferreira',  recipientPhone: '11999990001', buyerName: 'Carlos Ferreira',  buyerPhone: '11999990001', neighborhood: 'Jundiapeba',       zipCode: '08710-000', street: 'Rua das Flores',             streetNumber: '42',  deliveryDate: today,    deliveryPeriod: 'manha-i', items: [{ name: 'Buquê Rosas Vermelhas', price: 189.90, quantity: 1 }] },
  { recipientName: 'Beatriz Santos',      recipientPhone: '11999990002', buyerName: 'João Santos',      buyerPhone: '11999990002', neighborhood: 'Jundiapeba',       zipCode: '08715-010', street: 'Av. Américo Figueiredo',     streetNumber: '210', deliveryDate: today,    deliveryPeriod: 'manha-i', items: [{ name: 'Arranjo Primavera', price: 149.00, quantity: 1 }, { name: 'Cartão', price: 15.00, quantity: 1 }] },
  // Hoje — manhã-i — Mogi Centro (0878…)
  { recipientName: 'Cláudia Ribeiro',     recipientPhone: '11999990003', buyerName: 'Paulo Ribeiro',    buyerPhone: '11999990003', neighborhood: 'Centro',           zipCode: '08780-100', street: 'Rua Voluntários da Pátria',  streetNumber: '88',  deliveryDate: today,    deliveryPeriod: 'manha-i', items: [{ name: 'Orquídea Phalaenopsis', price: 220.00, quantity: 1 }] },
  // Hoje — tarde-i — Mogi Oeste (0873…)
  { recipientName: 'Daniela Costa',       recipientPhone: '11999990004', buyerName: 'Roberto Costa',    buyerPhone: '11999990004', neighborhood: 'Braz Cubas',       zipCode: '08730-200', street: 'Rua Oscar Americano',        streetNumber: '5',   deliveryDate: today,    deliveryPeriod: 'tarde-i', items: [{ name: 'Cesta Café da Manhã', price: 280.00, quantity: 1 }] },
  { recipientName: 'Eduardo Lima',        recipientPhone: '11999990005', buyerName: 'Fernanda Lima',    buyerPhone: '11999990005', neighborhood: 'Braz Cubas',       zipCode: '08733-050', street: 'Rua Dr. Alfredo Ellis',      streetNumber: '17',  deliveryDate: today,    deliveryPeriod: 'tarde-i', items: [{ name: 'Buquê Girassóis', price: 160.00, quantity: 1 }] },
  // Hoje — tarde-i — CEP fora do mapa → "Região não identificada"
  { recipientName: 'Fátima Oliveira',     recipientPhone: '11999990006', buyerName: 'Marcelo Oliveira', buyerPhone: '11999990006', neighborhood: 'Itaquaquecetuba',  zipCode: '08590-000', street: 'Rua Principal',              streetNumber: '300', deliveryDate: today,    deliveryPeriod: 'tarde-i', items: [{ name: 'Arranjo Tropical', price: 195.00, quantity: 1 }] },
  // Amanhã — manhã-i — Mogi Norte (0876…)
  { recipientName: 'Gabriela Melo',       recipientPhone: '11999990007', buyerName: 'Henrique Melo',    buyerPhone: '11999990007', neighborhood: 'Vila Oliveira',    zipCode: '08760-310', street: 'Rua Coronel Souza Franco',   streetNumber: '99',  deliveryDate: tomorrow, deliveryPeriod: 'manha-i', items: [{ name: 'Lírios Brancos', price: 175.00, quantity: 1 }, { name: 'Vaso decorativo', price: 45.00, quantity: 1 }] },
  { recipientName: 'Isabela Nunes',       recipientPhone: '11999990008', buyerName: 'Thiago Nunes',     buyerPhone: '11999990008', neighborhood: 'Vila Mogilar',     zipCode: '08773-000', street: 'Av. Narciso Yague Guedes',   streetNumber: '450', deliveryDate: tomorrow, deliveryPeriod: 'manha-i', items: [{ name: 'Box Surpresa Rosa', price: 320.00, quantity: 1 }] },
  // Amanhã — tarde-i — Mogi Leste
  { recipientName: 'Juliana Carvalho',    recipientPhone: '11999990009', buyerName: 'André Carvalho',   buyerPhone: '11999990009', neighborhood: 'Jundiapeba',       zipCode: '08712-100', street: 'Rua Padre Celestino',        streetNumber: '33',  deliveryDate: tomorrow, deliveryPeriod: 'tarde-i', items: [{ name: 'Buquê Misto 50 flores', price: 390.00, quantity: 1 }] },
  // Amanhã — tarde-i — Mogi Centro
  { recipientName: 'Larissa Souza',       recipientPhone: '11999990010', buyerName: 'Marcos Souza',     buyerPhone: '11999990010', neighborhood: 'Centro',           zipCode: '08780-050', street: 'Praça Monsenhor Roque Pinto', streetNumber: '12', deliveryDate: tomorrow, deliveryPeriod: 'tarde-i', items: [{ name: 'Arranjo Festa', price: 450.00, quantity: 1 }, { name: 'Balões', price: 30.00, quantity: 3 }] },
]

async function main() {
  // Delete all previous test orders (identified by test phone pattern)
  const existing = await prisma.order.findMany({
    where: { buyerPhone: { in: ORDERS.map((o) => o.buyerPhone) } },
    select: { id: true },
  })
  if (existing.length > 0) {
    const ids = existing.map((o) => o.id)
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.orderHistoryEntry.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.olistSyncEvent.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.order.deleteMany({ where: { id: { in: ids } } })
    console.log(`Removidos ${ids.length} pedidos anteriores.\n`)
  }

  console.log(`Inserindo ${ORDERS.length} pedidos...\n`)
  for (const o of ORDERS) {
    const order = await prisma.order.create({
      data: {
        status: 'ready',
        pickup: false,
        payment: 'pix',
        freight: 15.00,
        buyerName: o.buyerName,
        buyerPhone: o.buyerPhone,
        recipientName: o.recipientName,
        recipientPhone: o.recipientPhone,
        zipCode: o.zipCode,
        street: o.street,
        streetNumber: o.streetNumber,
        neighborhood: o.neighborhood,
        deliveryDate: parseDate(o.deliveryDate),
        deliveryPeriod: o.deliveryPeriod,
        source: 'admin',
        items: { create: o.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })) },
      },
    })
    console.log(`  #${order.id}  ${o.recipientName.padEnd(22)} ${o.deliveryDate}  ${o.deliveryPeriod.padEnd(9)}  ${o.zipCode}`)
  }

  console.log(`\nPronto.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
