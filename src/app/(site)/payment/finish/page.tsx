import { after } from 'next/server'
import type { Metadata } from 'next'
import { PRODUCTS, CATEGORY_LABELS } from '@/constants/products'
import { verifyToken } from '@/domains/checkout/token'
import { processarPagamento } from '@/domains/checkout/checkout.service'
import type { PurchaseData } from '@/core/analytics'
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
  const payload  = tokenStr ? await verifyToken(tokenStr) : null

  // payment_id é appendado pelo próprio MP na back_url
  const paymentId = get('payment_id') ?? get('collection_id')

  const orderId      = payload?.orderId ?? null
  const pedidoNumero = payload?.pedido ?? null
  const sku          = payload?.sku ?? null
  const customerName = payload?.nome ?? null
  const orderValue   = payload?.valor ?? 0
  const mpStatus     = get('status') ?? 'approved'
  const isFailed     = mpStatus === 'rejected' || mpStatus === 'cancelled'
  const isPending    = !isFailed && (mpStatus === 'pending' || mpStatus === 'in_process')
  const isApproved   = !isFailed && !isPending
  const trackingUrl  = isApproved && orderId ? `https://www.florapp.com.br/tracking/${orderId}` : null

  // Fallback: garante processamento mesmo se o webhook do MP ainda não disparou.
  // processarPagamento é idempotente — canTransition bloqueia dupla aprovação.
  if (isApproved && paymentId && orderId) {
    after(() =>
      processarPagamento(orderId, paymentId).catch((err) =>
        console.error('[finish] processarPagamento fallback falhou', { orderId, err }),
      ),
    )
  }

  const waMsg = `Olá! Tenho uma dúvida sobre meu pedido${orderId ? ` nº ${orderId}` : ''}.`
  const waUrl = `https://wa.me/5511972804138?text=${encodeURIComponent(waMsg)}`

  const product       = sku ? PRODUCTS.find((p) => p.sku === sku) : undefined
  const categoryLabel = product ? CATEGORY_LABELS[product.category] : null

  const purchaseData: PurchaseData | null = pedidoNumero && isApproved
    ? {
        transaction_id: pedidoNumero,
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
            {pedidoNumero && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Nº do pedido</span>
                <span className="font-mono font-bold text-gray-800">{pedidoNumero}</span>
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
