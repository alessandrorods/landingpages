'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { OrderList } from '@/components/order/OrderList'
import OrderDrawer from '@/components/order/OrderDrawer'
import type { OrderDTO } from '@/domains/orders/order.types'
import { STATUS_BADGE } from '@/constants/orderDisplay'

// ── Busca de pedido ───────────────────────────────────────────────────────────

function OrderSearch() {
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [err, setErr] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

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
      if (!res.ok) { setErr(data.error ?? 'Erro ao buscar pedido'); return }
      setOrder(data.order)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Rastrear pedido</p>
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
            <span className="text-2xl font-bold font-mono text-gray-900">#{order.id}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_BADGE[order.status]?.label ?? order.status}
              </span>
              <button onClick={() => { setOrder(null); setNumero('') }} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">×</button>
            </div>
          </div>
          {order.deliveryDate && (
            <p className="text-xs text-gray-500">Entrega prevista: <span className="font-medium text-gray-700">{order.deliveryDate}</span></p>
          )}
          {order.street && (
            <p className="text-sm text-gray-700">{order.neighborhood} — {order.street}, {order.streetNumber}</p>
          )}
          {order.courierName && (
            <p className="text-sm text-gray-700">Motoboy: <span className="font-semibold">{order.courierName}</span></p>
          )}
          <button onClick={() => setDrawerOpen(true)} className="text-xs text-blue-600 font-semibold underline">
            Ver detalhes completos
          </button>
        </div>
      )}

      {drawerOpen && order && (
        <OrderDrawer id={order.id} onClose={() => setDrawerOpen(false)} />
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpedicaoPage() {
  const readyHook        = useOrders('ready')
  const dispatchedHook   = useOrders('dispatched')
  const deliveredHook    = useOrders('delivered')
  const undeliveredHook  = useOrders('undelivered')

  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null)

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Expedição</h1>

      <OrderSearch />

      <div className="lg:flex lg:gap-2 lg:items-stretch" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <OrderList
          title="Pronto para Envio"
          badgeCls="bg-blue-100 text-blue-700"
          orders={readyHook.orders}
          loading={readyHook.loading}
          error={readyHook.error}
          onOpenOrder={setDrawerOrderId}
          accent="blue"
          defaultOpen
        />
        <OrderList
          title="Enviado"
          badgeCls="bg-orange-100 text-orange-700"
          orders={dispatchedHook.orders}
          loading={dispatchedHook.loading}
          error={dispatchedHook.error}
          onOpenOrder={setDrawerOrderId}
          accent="blue"
        />
        <OrderList
          title="Entregue"
          badgeCls="bg-green-100 text-green-800"
          orders={deliveredHook.orders}
          loading={deliveredHook.loading}
          error={deliveredHook.error}
          onOpenOrder={setDrawerOrderId}
          accent="blue"
        />
        <OrderList
          title="Não entregue"
          badgeCls="bg-red-100 text-red-700"
          orders={undeliveredHook.orders}
          loading={undeliveredHook.loading}
          error={undeliveredHook.error}
          onOpenOrder={setDrawerOrderId}
          accent="blue"
        />
      </div>

      {drawerOrderId !== null && (
        <OrderDrawer id={drawerOrderId} onClose={() => setDrawerOrderId(null)} />
      )}
    </div>
  )
}
