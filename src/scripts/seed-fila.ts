import prisma from '@/core/db/client'

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

const ORDERS = [
  // Hoje — manhã — Mogi Leste (08710-xxx)
  {
    recipientName: 'Ana Paula Ferreira',
    recipientPhone: '11999990001',
    buyerName: 'Carlos Ferreira',
    buyerPhone: '11999990001',
    neighborhood: 'Jundiapeba',
    zipCode: '08710-000',
    street: 'Rua das Flores',
    streetNumber: '42',
    deliveryDate: today,
    deliveryPeriod: 'manha',
    items: [{ name: 'Buquê Rosas Vermelhas', price: 189.90, quantity: 1 }],
  },
  {
    recipientName: 'Beatriz Santos',
    recipientPhone: '11999990002',
    buyerName: 'João Santos',
    buyerPhone: '11999990002',
    neighborhood: 'Jundiapeba',
    zipCode: '08715-010',
    street: 'Av. Américo Figueiredo',
    streetNumber: '210',
    deliveryDate: today,
    deliveryPeriod: 'manha',
    items: [
      { name: 'Arranjo Primavera', price: 149.00, quantity: 1 },
      { name: 'Cartão personalizado', price: 15.00, quantity: 1 },
    ],
  },
  // Hoje — manhã — Mogi Centro (08780-xxx)
  {
    recipientName: 'Cláudia Ribeiro',
    recipientPhone: '11999990003',
    buyerName: 'Paulo Ribeiro',
    buyerPhone: '11999990003',
    neighborhood: 'Centro',
    zipCode: '08780-100',
    street: 'Rua Voluntários da Pátria',
    streetNumber: '88',
    deliveryDate: today,
    deliveryPeriod: 'manha',
    items: [{ name: 'Orquídea Phalaenopsis', price: 220.00, quantity: 1 }],
  },
  // Hoje — tarde — Mogi Oeste (08730-xxx)
  {
    recipientName: 'Daniela Costa',
    recipientPhone: '11999990004',
    buyerName: 'Roberto Costa',
    buyerPhone: '11999990004',
    neighborhood: 'Braz Cubas',
    zipCode: '08730-200',
    street: 'Rua Oscar Americano',
    streetNumber: '5',
    deliveryDate: today,
    deliveryPeriod: 'tarde',
    items: [{ name: 'Cesta Café da Manhã', price: 280.00, quantity: 1 }],
  },
  {
    recipientName: 'Eduardo Lima',
    recipientPhone: '11999990005',
    buyerName: 'Fernanda Lima',
    buyerPhone: '11999990005',
    neighborhood: 'Braz Cubas',
    zipCode: '08733-050',
    street: 'Rua Dr. Alfredo Ellis',
    streetNumber: '17',
    deliveryDate: today,
    deliveryPeriod: 'tarde',
    items: [{ name: 'Buquê Girassóis', price: 160.00, quantity: 1 }],
  },
  // Hoje — tarde — CEP fora do mapa → "Região não identificada"
  {
    recipientName: 'Fátima Oliveira',
    recipientPhone: '11999990006',
    buyerName: 'Marcelo Oliveira',
    buyerPhone: '11999990006',
    neighborhood: 'Itaquaquecetuba',
    zipCode: '08590-000',
    street: 'Rua Principal',
    streetNumber: '300',
    deliveryDate: today,
    deliveryPeriod: 'tarde',
    items: [{ name: 'Arranjo Tropical', price: 195.00, quantity: 1 }],
  },
  // Amanhã — manhã — Mogi Norte (08760-xxx)
  {
    recipientName: 'Gabriela Melo',
    recipientPhone: '11999990007',
    buyerName: 'Henrique Melo',
    buyerPhone: '11999990007',
    neighborhood: 'Vila Oliveira',
    zipCode: '08760-310',
    street: 'Rua Coronel Souza Franco',
    streetNumber: '99',
    deliveryDate: tomorrow,
    deliveryPeriod: 'manha',
    items: [
      { name: 'Lírios Brancos', price: 175.00, quantity: 1 },
      { name: 'Vaso decorativo', price: 45.00, quantity: 1 },
    ],
  },
  {
    recipientName: 'Isabela Nunes',
    recipientPhone: '11999990008',
    buyerName: 'Thiago Nunes',
    buyerPhone: '11999990008',
    neighborhood: 'Vila Mogilar',
    zipCode: '08773-000',
    street: 'Av. Narciso Yague Guedes',
    streetNumber: '450',
    deliveryDate: tomorrow,
    deliveryPeriod: 'manha',
    items: [{ name: 'Box Surpresa Rosa', price: 320.00, quantity: 1 }],
  },
  // Amanhã — tarde — Mogi Leste
  {
    recipientName: 'Juliana Carvalho',
    recipientPhone: '11999990009',
    buyerName: 'André Carvalho',
    buyerPhone: '11999990009',
    neighborhood: 'Jundiapeba',
    zipCode: '08712-100',
    street: 'Rua Padre Celestino',
    streetNumber: '33',
    deliveryDate: tomorrow,
    deliveryPeriod: 'tarde',
    items: [{ name: 'Buquê Misto 50 flores', price: 390.00, quantity: 1 }],
  },
  // Amanhã — tarde — Mogi Centro
  {
    recipientName: 'Larissa Souza',
    recipientPhone: '11999990010',
    buyerName: 'Marcos Souza',
    buyerPhone: '11999990010',
    neighborhood: 'Centro',
    zipCode: '08780-050',
    street: 'Praça Monsenhor Roque Pinto',
    streetNumber: '12',
    deliveryDate: tomorrow,
    deliveryPeriod: 'tarde',
    items: [
      { name: 'Arranjo Festa', price: 450.00, quantity: 1 },
      { name: 'Balões', price: 30.00, quantity: 3 },
    ],
  },
]

async function main() {
  console.log(`Inserindo ${ORDERS.length} pedidos simulados para a fila de despacho...\n`)

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
        items: {
          create: o.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        },
      },
    })
    console.log(`  #${order.id}  ${o.recipientName.padEnd(22)} ${o.deliveryDate}  ${o.deliveryPeriod}  ${o.zipCode}`)
  }

  console.log(`\nPronto. Acesse /admin/fila para ver a fila.`)
  console.log(`Configure as regiões em /admin/settings para agrupar por região.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
