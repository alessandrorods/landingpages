import { hmacVerify } from '@/core/signing'
import { parseClienteObs } from '@/clients/loja-integrada/obs-parser'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'
import type { LIWebhookPayload } from '@/clients/loja-integrada/types'
import type { Actor } from './order.types'
import type { withOrderHistory } from './order-history.decorator'
import type { OrderRepository } from './order.repository'

type DecoratedOrderService = ReturnType<typeof withOrderHistory>

function firstPhone(c: LIWebhookPayload['cliente']): string {
  return c.telefone_celular ?? c.telefone_comercial ?? c.telefone_principal ?? ''
}

function resolveDeliveryPeriod(
  payload: LIWebhookPayload,
  mapping: Record<string, string>,
): string | undefined {
  const envioId = payload.envios?.[0]?.forma_envio?.id
  if (!envioId) return undefined
  return mapping[String(envioId)] || undefined
}

function fallbackDeliveryDate(isoDate: string): string {
  // Convert UTC ISO to Brasília (UTC-3) then format DD/MM/YYYY
  const d = new Date(new Date(isoDate).getTime() - 3 * 60 * 60 * 1000)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

const SYSTEM_ACTOR: Actor = { type: 'system', name: 'Loja Integrada' }

export function createLojaIntegradaWebhookService(
  orderService: DecoratedOrderService,
  orderRepository: OrderRepository,
) {
  const configService = createConfigService(createConfigRepository())

  async function validateToken(authHeader: string | null): Promise<boolean> {
    if (!authHeader) return false
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const secret = await configService.get('liWebhookSecret')
    if (!secret) return false
    return hmacVerify(secret, token)
  }

  return {
    async processWebhook(authHeader: string | null, payload: LIWebhookPayload): Promise<void> {
      const valid = await validateToken(authHeader)
      if (!valid) {
        console.warn('[li-webhook] token inválido — ignorando')
        return
      }

      if (payload.tipo !== 'pedido_venda') return
      if (!payload.situacao.situacao_alterada) return

      const { aprovado, cancelado } = payload.situacao

      if (aprovado) {
        const existing = await orderRepository.findByOlistId(payload.id)
        if (existing) return // idempotência

        const [obs, envioMapping] = [
          parseClienteObs(payload.cliente_obs),
          await configService.get('liEnvioMapping'),
        ]
        const addr = payload.endereco_entrega
        const phone = firstPhone(payload.cliente)
        const deliveryPeriod = resolveDeliveryPeriod(payload, envioMapping)

        const created = await orderService.createOrder({
          source: 'loja_integrada',
          pickup: false,
          payment: 'card',
          freight: parseFloat(String(payload.valor_envio)),
          buyerName: payload.cliente.nome,
          buyerPhone: phone,
          recipientName: obs.recipientName ?? payload.cliente.nome,
          recipientPhone: phone,
          cardMessage: obs.cardMessage ?? undefined,
          notes: obs.notes ?? undefined,
          deliveryDate: obs.deliveryDate ?? fallbackDeliveryDate(payload.data_criacao),
          deliveryPeriod,
          zipCode: addr.cep,
          street: addr.endereco,
          streetNumber: addr.numero,
          complement: addr.complemento ?? undefined,
          neighborhood: addr.bairro,
          items: payload.itens.map((i) => ({
            sku: i.sku || undefined,
            name: i.nome,
            price: parseFloat(String(i.preco_venda)),
            quantity: Math.round(parseFloat(String(i.quantidade))),
          })),
          initialStatus: 'approved',
        }, SYSTEM_ACTOR)

        await orderRepository.updateOlistRef(created.id, payload.id, String(payload.numero))
        return
      }

      if (cancelado) {
        const existing = await orderRepository.findByOlistId(payload.id)
        if (!existing) return
        if (existing.status !== 'pending' && existing.status !== 'approved') return
        try {
          await orderService.updateStatus(existing.id, 'cancelled', SYSTEM_ACTOR)
        } catch {
          // order may already be in a non-cancellable state — ignore
        }
      }
    },
  }
}

export type LojaIntegradaWebhookService = ReturnType<typeof createLojaIntegradaWebhookService>
