import type { Metadata } from 'next'
import { PRODUCTS, CATEGORY_LABELS } from '@/constants/products'
import { createMercadoPagoClient } from '@/lib/mercadopago/client'
import { createOlistClient } from '@/lib/olist/client'
import { createPedidoService } from '@/lib/olist/pedido.service'
import { verifyToken } from '@/lib/checkout/token'
import type { SituacaoPedido } from '@/lib/olist/types'
import type { PurchaseData } from '@/lib/analytics'
import ConversionEvents from './components/ConversionEvents'
import { TrackingCard } from './components/TrackingCard'

export const metadata: Metadata = {
  title: 'Pedido Confirmado! - Mundo Planta Flores e Presentes',
  description: 'Seu pedido foi confirmado. Obrigado pela compra!',
  robots: { index: false, follow: false },
}

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const MP_SITUACAO: Partial<Record<string, SituacaoPedido>> = {
  approved:   'aprovado',
  cancelled:  'cancelado',
  rejected:   'cancelado',
}

async function sincronizarSituacao(pedidoId: number, mpPagamentoId: string): Promise<string | null> {
  const accessToken = process.env.MP_ACCESS_TOKEN
  const tinyToken   = process.env.TINY_TOKEN
  if (!accessToken || !tinyToken || pedidoId === 0) return null

  try {
    const mpClient      = createMercadoPagoClient(accessToken)
    const pagamento     = await mpClient.buscarPagamento(mpPagamentoId)
    const situacao      = MP_SITUACAO[pagamento.status]

    if (situacao) {
      const olistClient   = createOlistClient(tinyToken)
      const pedidoService = createPedidoService(olistClient)
      await pedidoService.atualizarSituacao(pedidoId, situacao)
    }

    return pagamento.status
  } catch (err) {
    console.error('Erro ao sincronizar situação do pedido', { pedidoId, mpPagamentoId, err })
    return null
  }
}

export default async function PaymentFinishPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = await searchParams
  const get = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v.trim() : undefined
  }

  const rawToken = params['payment_token']
  const tokenStr = typeof rawToken === 'string' ? rawToken : null
  const payload  = tokenStr ? verifyToken(tokenStr) : null

  // payment_id é appendado pelo próprio MP na back_url
  const paymentId = get('payment_id') ?? get('collection_id')

  if (payload && paymentId && payload.pedidoId !== 0) {
    // não await — dispara em background para não bloquear a renderização
    void sincronizarSituacao(payload.pedidoId, paymentId)
  }

  const pedidoId     = payload?.pedidoId ?? 0
  const orderId      = payload?.pedido ?? null
  const sku          = payload?.sku ?? null
  const customerName = payload?.nome ?? null
  const orderValue   = payload?.valor ?? 0
  const mpStatus     = get('status') ?? 'approved'
  const isFailed     = mpStatus === 'rejected' || mpStatus === 'cancelled'
  const isPending    = !isFailed && (mpStatus === 'pending' || mpStatus === 'in_process')
  const isApproved   = !isFailed && !isPending
  const trackingUrl  = isApproved && pedidoId > 0 ? `https://www.florapp.com.br/tracking/${pedidoId}` : null

  const waMsg = `Olá! Tenho uma dúvida sobre meu pedido${orderId ? ` nº ${orderId}` : ''}.`
  const waUrl = `https://wa.me/5511972804138?text=${encodeURIComponent(waMsg)}`

  const product       = sku ? PRODUCTS.find((p) => p.sku === sku) : undefined
  const categoryLabel = product ? CATEGORY_LABELS[product.category] : null

  const purchaseData: PurchaseData | null = orderId && isApproved
    ? {
        transaction_id: orderId,
        value: orderValue,
        items: product
          ? [{ item_id: product.sku, item_name: product.name, item_category: product.category, price: orderValue }]
          : [],
      }
    : null

  return (
    <main className="min-h-screen bg-[#F0F9F3] flex flex-col items-center justify-start py-10 px-4">
      {purchaseData && <ConversionEvents purchase={purchaseData} />}

      <div className="w-full max-w-lg space-y-6">
        {/* ── Ícone de status ── */}
        <div className="flex flex-col items-center text-center gap-3 pt-4">
          {isFailed ? (
            <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : isPending ? (
            <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#1E7439] flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          <div>
            {isFailed ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  Pagamento não aprovado
                </h1>
                <p className="text-gray-500 mt-1 text-sm sm:text-base">
                  Não conseguimos processar seu pagamento. Tente novamente.
                </p>
              </>
            ) : isPending ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  Pagamento em análise
                </h1>
                <p className="text-gray-500 mt-1 text-sm sm:text-base">
                  Assim que confirmado, seu pedido entra em produção. 🌸
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {customerName ? `${customerName}, pedido confirmado!` : 'Pedido confirmado!'} 🎉
                </h1>
                <p className="text-gray-500 mt-1 text-sm sm:text-base">
                  Sua mãe vai amar. Você fez a escolha certa. 🌸
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Resumo do pedido ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1E7439] px-5 py-3">
            <p className="text-white text-xs font-semibold uppercase tracking-widest">Resumo do Pedido</p>
          </div>

          <div className="p-5 space-y-4">
            {orderId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Nº do pedido</span>
                <span className="font-mono font-bold text-gray-800">{orderId}</span>
              </div>
            )}

            {product && (
              <div className="flex justify-between items-start text-sm gap-4">
                <span className="text-gray-500 shrink-0">Produto</span>
                <div className="text-right">
                  <p className="font-semibold text-gray-800 leading-snug">{product.name}</p>
                  {categoryLabel && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {categoryLabel.emoji} {categoryLabel.label}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
              <span className="font-semibold text-gray-700">Total pago</span>
              <span className="text-xl font-extrabold text-[#1E7439]">
                {orderValue > 0 ? formatPrice(orderValue) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Rastreio ── */}
        {trackingUrl && <TrackingCard url={trackingUrl} />}

        <p className="text-center text-xs text-gray-400 pb-6">
          Algum problema?{' '}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            Fale com a gente pelo WhatsApp
          </a>
          .
        </p>
      </div>
    </main>
  )
}
