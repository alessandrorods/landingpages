'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import OrderDrawer from '@/components/OrderDrawer'
import type { OrderDTO } from '@/domains/orders/order.types'
import { DeliveryLabel } from '@/app/admin/components/DeliveryLabel'

function todayFormatted(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aguardando pagamento',
  aprovado: 'Pago',
  preparando_envio: 'Preparando',
  faturado: 'Faturado',
  pronto_envio: 'Pronto para envio',
  enviado: 'Saiu para entrega',
  entregue: 'Entregue',
  nao_entregue: 'Não entregue',
  cancelado: 'Cancelado',
}

// ── Busca de pedido ───────────────────────────────────────────────────────────

function BuscaPedido() {
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [err, setErr] = useState('')
  const [drawerAberto, setDrawerAberto] = useState(false)

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    const n = numero.trim()
    if (!n) return
    setLoading(true)
    setErr('')
    setOrder(null)
    try {
      const res = await fetch(`/api/admin/orders/search?numero=${encodeURIComponent(n)}`)
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error ?? 'Erro ao buscar pedido')
        return
      }
      setOrder(data.order)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Rastrear pedido
      </p>

      <form onSubmit={buscar} className="flex gap-2 mb-3">
        <input
          type="number"
          inputMode="numeric"
          value={numero}
          onChange={(e) => { setNumero(e.target.value); setErr(''); setOrder(null) }}
          placeholder="Nº do pedido"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={loading || !numero.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {order && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-gray-900">#{order.olistNumero ?? '—'}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
              <button
                onClick={() => { setOrder(null); setNumero('') }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                aria-label="Fechar resultado"
              >
                ×
              </button>
            </div>
          </div>

          {order.deliveryDate && (
            <p className="text-xs text-gray-500">Entrega prevista: <span className="font-medium text-gray-700">{order.deliveryDate}</span></p>
          )}

          <p className="text-sm text-gray-700">
            {order.neighborhood} — {order.street}, {order.streetNumber}
          </p>

          {order.courierName && (
            <p className="text-sm text-gray-700">
              Motoboy: <span className="font-semibold">{order.courierName}</span>
            </p>
          )}

          <button
            onClick={() => setDrawerAberto(true)}
            className="text-xs text-blue-600 font-semibold underline"
          >
            Ver detalhes completos
          </button>
        </div>
      )}

      {drawerAberto && order && (
        <OrderDrawer id={order.id} onClose={() => setDrawerAberto(false)} />
      )}
    </div>
  )
}

// ── Card de resumo ────────────────────────────────────────────────────────────

function PedidoResumoCard({ order, onOpen }: { order: OrderDTO; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl font-bold font-mono text-gray-900 bg-blue-50 px-3 py-1 rounded-xl leading-none">
          #{order.olistNumero ?? '—'}
        </span>
        <DeliveryLabel data={order.deliveryDate} />
      </div>
      <p className="font-semibold text-gray-900 truncate">{order.buyerName}</p>
      <div className="flex justify-end mt-2">
        <span className="text-xs text-blue-600 font-semibold">Ver detalhes ›</span>
      </div>
    </button>
  )
}

// ── Coluna ────────────────────────────────────────────────────────────────────

interface ColunaProps {
  titulo: string
  cor: string
  orders: OrderDTO[]
  loading: boolean
  error: string
  onOpenPedido: (id: string) => void
}

function Coluna({ titulo, cor, orders, loading, error, onOpenPedido }: ColunaProps) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <h2 className="text-sm font-bold text-gray-800">{titulo}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`}>
          {loading ? '…' : orders.length}
        </span>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum pedido</p>
      )}

      {!loading && orders.map((order) => (
        <PedidoResumoCard key={order.id} order={order} onOpen={() => onOpenPedido(order.id)} />
      ))}
    </div>
  )
}

// ── Accordion (mobile) ────────────────────────────────────────────────────────

interface AccordionSectionProps extends ColunaProps {
  open: boolean
  onToggle: () => void
}

function AccordionSection({ titulo, cor, orders, loading, error, onOpenPedido, open, onToggle }: AccordionSectionProps) {
  return (
    <div className="border border-gray-100 rounded-2xl bg-white shadow-sm mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-800">{titulo}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`}>
            {loading ? '…' : orders.length}
          </span>
        </div>
        <span className="text-gray-400 text-lg leading-none">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {loading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
          )}

          {!loading && !error && orders.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum pedido</p>
          )}

          {!loading && orders.map((order) => (
            <PedidoResumoCard key={order.id} order={order} onOpen={() => onOpenPedido(order.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpedicaoPage() {
  const today = todayFormatted()

  const prontoEnvio = useOrders('pronto_envio')
  const enviado = useOrders('enviado')
  const entregue = useOrders('entregue', today)

  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null)
  const [openSection, setOpenSection] = useState<string>('pronto_envio')

  const colunas = [
    {
      key: 'pronto_envio',
      titulo: 'Pronto para envio',
      cor: 'bg-blue-100 text-blue-700',
      orders: prontoEnvio.orders,
      loading: prontoEnvio.loading,
      error: prontoEnvio.error,
    },
    {
      key: 'enviado',
      titulo: 'Enviado',
      cor: 'bg-orange-100 text-orange-700',
      orders: enviado.orders,
      loading: enviado.loading,
      error: enviado.error,
    },
    {
      key: 'entregue',
      titulo: 'Entregue',
      cor: 'bg-green-100 text-green-800',
      orders: entregue.orders,
      loading: entregue.loading,
      error: entregue.error,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Expedição</h1>

      <BuscaPedido />

      {/* Desktop: 3 colunas */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
        {colunas.map((col) => (
          <Coluna
            key={col.key}
            titulo={col.titulo}
            cor={col.cor}
            orders={col.orders}
            loading={col.loading}
            error={col.error}
            onOpenPedido={setDrawerOrderId}
          />
        ))}
      </div>

      {/* Mobile: accordion */}
      <div className="lg:hidden">
        {colunas.map((col) => (
          <AccordionSection
            key={col.key}
            titulo={col.titulo}
            cor={col.cor}
            orders={col.orders}
            loading={col.loading}
            error={col.error}
            onOpenPedido={setDrawerOrderId}
            open={openSection === col.key}
            onToggle={() => setOpenSection(openSection === col.key ? '' : col.key)}
          />
        ))}
      </div>

      {drawerOrderId !== null && (
        <OrderDrawer id={drawerOrderId} onClose={() => setDrawerOrderId(null)} />
      )}
    </div>
  )
}
