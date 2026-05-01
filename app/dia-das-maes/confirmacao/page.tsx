import type { Metadata } from 'next'
import Link from 'next/link'
import { PRODUCTS, CATEGORY_LABELS } from '@/constants/products'
import type { PurchaseData } from '@/lib/analytics'
import ConversionEvents from './components/ConversionEvents'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Pedido Confirmado! | Mundo Planta',
  description: 'Seu pedido foi confirmado. Obrigado pela compra!',
  // Página de conversão não deve ser indexada
  robots: { index: false, follow: false },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Entrega estimada: 10/05/2026 — data fixa da campanha */
const DELIVERY_DATE = '10 de Maio de 2026'

// ─── Page ─────────────────────────────────────────────────────────────────────

// Params esperados do gateway de pagamento:
//   pedido  → ID da transação    (ex: ORD-12345)
//   sku     → SKU do produto     (ex: MP-FL-001) — resolvido internamente
//   valor   → Valor pago em BRL  (ex: 149.90)
//   nome    → Nome do cliente    (opcional, para personalização)

export default async function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const params = await searchParams

  const get = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v.trim() : undefined
  }

  const orderId       = get('pedido') ?? `ORD-${Date.now()}`
  const sku           = get('sku')
  const rawValor      = get('valor')
  const customerName  = get('nome')

  // Resolve o produto pelo SKU — não depende de dados sensíveis na URL
  const product = sku ? PRODUCTS.find((p) => p.sku === sku) : undefined
  const orderValue = rawValor ? parseFloat(rawValor) : (product?.price ?? 0)

  // Dados de conversão passados ao componente client
  const purchaseData: PurchaseData = {
    transaction_id: orderId,
    value: orderValue,
    items: product
      ? [{ item_id: product.sku, item_name: product.name, item_category: product.category, price: orderValue }]
      : [],
  }

  const categoryLabel = product ? CATEGORY_LABELS[product.category] : null

  return (
    <main className="min-h-screen bg-[#F0F9F3] flex flex-col items-center justify-start py-10 px-4">
      {/* Dispara todos os eventos de conversão assim que o cliente monta */}
      <ConversionEvents purchase={purchaseData} />

      <div className="w-full max-w-lg space-y-6">
        {/* ── Ícone de sucesso ── */}
        <div className="flex flex-col items-center text-center gap-3 pt-4">
          <div className="w-20 h-20 rounded-full bg-[#1E7439] flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {customerName ? `${customerName}, pedido confirmado!` : 'Pedido confirmado!'} 🎉
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Sua mãe vai amar. Você fez a escolha certa. 🌸
            </p>
          </div>
        </div>

        {/* ── Resumo do pedido ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1E7439] px-5 py-3">
            <p className="text-white text-xs font-semibold uppercase tracking-widest">Resumo do Pedido</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Nº do pedido */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Nº do pedido</span>
              <span className="font-mono font-bold text-gray-800">{orderId}</span>
            </div>

            {/* Produto */}
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

            {/* Valor pago */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
              <span className="font-semibold text-gray-700">Total pago</span>
              <span className="text-xl font-extrabold text-[#1E7439]">
                {orderValue > 0 ? formatPrice(orderValue) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Entrega ── */}
        <div className="bg-[#1E7439] rounded-2xl p-5 text-white space-y-1">
          <div className="flex items-center gap-2 font-bold text-base">
            <span>🚚</span>
            <span>Entrega Garantida</span>
          </div>
          <p className="text-green-100 text-sm leading-relaxed">
            Seu pedido será entregue até{' '}
            <strong className="text-white">{DELIVERY_DATE}</strong>, a tempo para o
            Dia das Mães. Você receberá a confirmação por e-mail.
          </p>
        </div>

        {/* ── O que acontece agora ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h2 className="font-bold text-gray-800 text-sm uppercase tracking-widest">
            O que acontece agora
          </h2>
          <ul className="space-y-2.5 text-sm text-gray-600">
            {[
              { step: '1', text: 'Você receberá um e-mail com os detalhes do pedido' },
              { step: '2', text: 'Nossa equipe prepara o presente com todo o cuidado' },
              { step: '3', text: 'Entregamos na data combinada, fresquinho e embalado' },
              { step: '4', text: 'Sua mãe recebe e fica feliz demais 💚' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E8F5EC] text-[#1E7439] text-xs font-bold flex items-center justify-center mt-0.5">
                  {step}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dia-das-maes"
            className="flex-1 inline-flex items-center justify-center bg-[#1E7439] hover:bg-[#155C2C] text-white font-bold py-4 rounded-xl transition-colors text-sm"
          >
            🌺 Ver mais produtos
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center border-2 border-gray-200 text-gray-600 hover:border-[#1E7439] hover:text-[#1E7439] font-semibold py-4 rounded-xl transition-colors text-sm"
          >
            Ir para a loja
          </Link>
        </div>

        {/* ── Rodapé ── */}
        <p className="text-center text-xs text-gray-400 pb-6">
          Dúvidas? Entre em contato com nosso atendimento.{' '}
          <br className="sm:hidden" />
          Atendemos de Segunda a Domingo, das 8h às 20h.
        </p>
      </div>
    </main>
  )
}
