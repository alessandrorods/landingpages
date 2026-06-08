import { createHmac, timingSafeEqual } from 'crypto'
import { createMercadoPagoClient } from '@/clients/mercadopago/client'
import { processarPagamento, CheckoutError } from '@/domains/checkout/checkout.service'
import type { MPWebhookPayload } from '@/clients/mercadopago/types'

function verifyMPSignature(
  signature: string | null,
  requestId: string,
  dataId: string,
  secret: string,
): boolean {
  if (!signature) return false

  const parts: Record<string, string> = {}
  for (const part of signature.split(',')) {
    const eq = part.indexOf('=')
    if (eq !== -1) parts[part.slice(0, eq)] = part.slice(eq + 1)
  }
  const { ts, v1 } = parts
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET

  let body: MPWebhookPayload
  try {
    body = (await request.json()) as MPWebhookPayload
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  if (webhookSecret) {
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id') ?? ''
    const dataId = body.data?.id ?? ''
    if (!verifyMPSignature(signature, requestId, dataId, webhookSecret)) {
      console.warn('Webhook MP com assinatura inválida', { signature, requestId, dataId })
      return Response.json({ error: 'Assinatura inválida' }, { status: 401 })
    }
  } else {
    console.warn('MP_WEBHOOK_SECRET não configurado — verificação de assinatura desabilitada')
  }

  if (body.type !== 'payment') {
    return Response.json({ ok: true })
  }

  const mpPagamentoId = body.data?.id
  if (!mpPagamentoId) {
    return Response.json({ error: 'ID de pagamento ausente' }, { status: 400 })
  }

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    console.error('MP_ACCESS_TOKEN não configurado')
    return Response.json({ error: 'Configuração inválida' }, { status: 500 })
  }

  let orderId: number
  try {
    const mpClient = createMercadoPagoClient(accessToken)
    const pagamento = await mpClient.buscarPagamento(mpPagamentoId)
    const externalRef = pagamento.external_reference
    if (!externalRef) {
      console.error('external_reference ausente no pagamento', { mpPagamentoId })
      return Response.json({ error: 'Referência externa ausente' }, { status: 422 })
    }
    orderId = parseInt(externalRef, 10)
    if (isNaN(orderId)) {
      console.error('external_reference inválido', { externalRef })
      return Response.json({ error: 'Referência externa inválida' }, { status: 422 })
    }
  } catch (err) {
    console.error('Erro ao buscar pagamento no MP', err)
    return Response.json({ error: 'Erro ao consultar pagamento' }, { status: 502 })
  }

  try {
    await processarPagamento(orderId, mpPagamentoId)
    return Response.json({ ok: true })
  } catch (err) {
    if (err instanceof CheckoutError) {
      return Response.json({ error: err.message }, { status: err.status })
    }
    console.error('Erro inesperado no webhook de pagamento', err)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
