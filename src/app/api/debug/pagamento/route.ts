import { createMercadoPagoClient } from '@/clients/mercadopago/client'
import { createPagamentoService } from '@/domains/pagamentos/pagamento.service'
import { signToken } from '@/domains/checkout/token'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Não disponível em produção' }, { status: 403 })
  }

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    return Response.json({ error: 'MP_ACCESS_TOKEN não configurado' }, { status: 500 })
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  const token = await signToken({ orderId: 'debug-00000000-0000-0000-0000-000000000000', pedido: 'DEBUG-001', sku: 'AR06', nome: 'Alessandro', valor: 184.90 })
  const confirmacaoUrl = `${baseUrl}/payment/finish?payment_token=${token}`

  const mpClient = createMercadoPagoClient(accessToken)
  const pagamentoService = createPagamentoService(mpClient)

  try {
    const preferencia = await pagamentoService.criarPreferencia({
      external_reference: 'debug-001',
      items: [
        {
          id: 'AR06',
          title: 'Arranjo Mix de Flores com Ferrero Rocher',
          quantity: 1,
          unit_price: 169.90,
          currency_id: 'BRL',
        },
        {
          id: 'frete',
          title: 'Taxa de entrega',
          quantity: 1,
          unit_price: 15.00,
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: 'Alessandro',
        phone: { number: '11964757574' },
      },
      back_urls: {
        success: confirmacaoUrl,
        failure: confirmacaoUrl,
        pending: confirmacaoUrl,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/payment/webhook`,
    })

    return Response.json({ redirectUrl: preferencia.initPoint })
  } catch (err) {
    console.error('Erro ao criar preferência de debug', err)
    return Response.json({ error: 'Erro ao criar preferência no MercadoPago' }, { status: 502 })
  }
}
