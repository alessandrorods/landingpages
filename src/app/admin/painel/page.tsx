'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOrders } from '@/hooks/useOrders'
import OrderDrawer from '@/components/order/OrderDrawer'
import { OrderList } from '@/components/order/OrderList'
import { PrintOverlay } from '@/components/order/PrintOverlay'
import { STATUS_BADGE } from '@/constants/orderDisplay'
import type { OrderDTO } from '@/domains/orders/order.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayFormatted(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}


// ── Busca de pedido ────────────────────────────────────────────────────────────

function BuscaPedidoPanel({ onClose: onClosePanel }: { onClose: () => void }) {
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
      if (!res.ok) { setErr(data.error ?? 'Erro ao buscar pedido'); return }
      setOrder(data.order)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rastrear pedido</p>
        <button onClick={onClosePanel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      </div>

      <form onSubmit={buscar} className="flex gap-2 mb-3">
        <input
          type="number"
          inputMode="numeric"
          value={numero}
          onChange={(e) => { setNumero(e.target.value); setErr(''); setOrder(null) }}
          placeholder="Nº do pedido"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          autoFocus
          required
        />
        <button
          type="submit"
          disabled={loading || !numero.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
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
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_BADGE[order.status]?.label ?? order.status}
              </span>
              <button onClick={() => { setOrder(null); setNumero('') }} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">×</button>
            </div>
          </div>
          {order.deliveryDate && (
            <p className="text-xs text-gray-500">Entrega prevista: <span className="font-medium text-gray-700">{order.deliveryDate}</span></p>
          )}
          <p className="text-sm text-gray-700">{order.neighborhood} — {order.street}, {order.streetNumber}</p>
          {order.courierName && (
            <p className="text-sm text-gray-700">Motoboy: <span className="font-semibold">{order.courierName}</span></p>
          )}
          <button onClick={() => setDrawerAberto(true)} className="text-xs text-purple-600 font-semibold underline">
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

// ── Barra de topo ─────────────────────────────────────────────────────────────

function PainelTopBar({
  totalCount,
  lastUpdate,
  nextRefreshAt,
  onRefresh,
  loading,
  searchOpen,
  onToggleSearch,
}: {
  totalCount: number
  lastUpdate: Date | null
  nextRefreshAt: number | null
  onRefresh: () => void
  loading: boolean
  searchOpen: boolean
  onToggleSearch: () => void
}) {
  const [secs, setSecs] = useState<number | null>(null)

  useEffect(() => {
    if (!nextRefreshAt || loading) { setSecs(null); return }
    function tick() { setSecs(Math.max(0, Math.ceil((nextRefreshAt! - Date.now()) / 1000))) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [nextRefreshAt, loading])

  const time = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <h1 className="text-xl font-bold text-gray-900 shrink-0">Painel da Operação</h1>
      <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full shrink-0">
        {totalCount} {totalCount === 1 ? 'pedido' : 'pedidos'}
      </span>
      <div className="flex-1" />
      {secs !== null && (
        <span className="text-xs text-gray-400 tabular-nums shrink-0">{secs}s</span>
      )}
      <button onClick={onRefresh} disabled={loading} className="text-sm text-purple-700 font-medium disabled:opacity-40 shrink-0">
        {loading ? '...' : '↻ Atualizar'}
      </button>
      {time && <span className="text-xs text-gray-400 shrink-0">· {time}</span>}
      <button
        onClick={onToggleSearch}
        aria-label="Buscar pedido"
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${searchOpen ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  )
}

// ── Ações admin no drawer ─────────────────────────────────────────────────────

function AdminPainelActions({ order, onClose }: { order: OrderDTO; onClose: () => void }) {
  const status = order.status
  const [motoboy, setMotoboy] = useState(order.courierName ?? '')
  const [recebidoPor, setRecebidoPor] = useState(order.recipientName)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')
  const [printing, setPrinting] = useState(false)

  const closeAfterDelay = useCallback(() => setTimeout(onClose, 1500), [onClose])

  async function mudarStatus(novoStatus: string) {
    setLoading(true); setErr(''); setDone('')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: novoStatus }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Erro ao atualizar'); return }
      if (novoStatus === 'preparing') {
        setPrinting(true)
      } else {
        setDone(`Marcado como: ${STATUS_BADGE[novoStatus as keyof typeof STATUS_BADGE]?.label ?? novoStatus}`)
        closeAfterDelay()
      }
    } catch { setErr('Erro de conexão') } finally { setLoading(false) }
  }

  async function marcarEnviado() {
    if (!motoboy.trim()) return
    setLoading(true); setErr(''); setDone('')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motoboy: motoboy.trim() }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Erro ao despachar'); return }
      setDone('Marcado como: Saiu para entrega')
      closeAfterDelay()
    } catch { setErr('Erro de conexão') } finally { setLoading(false) }
  }

  async function marcarEntregue() {
    if (!recebidoPor.trim()) return
    setLoading(true); setErr(''); setDone('')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recebidoPor: recebidoPor.trim(), motoboy: motoboy.trim() || 'Admin' }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Erro ao confirmar entrega'); return }
      setDone('Entrega confirmada!')
      closeAfterDelay()
    } catch { setErr('Erro de conexão') } finally { setLoading(false) }
  }

  if (done) {
    return <p className="text-center text-green-700 font-semibold py-2 text-sm">✓ {done}</p>
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'
  const btnPrimary = (color: string) => `w-full ${color} disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors`
  const btnSecondary = 'w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors'
  const btnDanger = 'w-full border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl text-sm transition-colors'

  return (
    <div className="space-y-2">
      {printing && <PrintOverlay order={order} onClose={() => { setPrinting(false); onClose() }} />}
      {err && <p className="text-xs text-red-600 mb-1">{err}</p>}

      {status === 'pending' && (
        <button onClick={() => mudarStatus('approved')} disabled={loading} className={btnPrimary('bg-green-600 hover:bg-green-700')}>
          {loading ? 'Atualizando...' : '✓ Marcar como Pago'}
        </button>
      )}

      {status === 'approved' && (
        <button onClick={() => mudarStatus('preparing')} disabled={loading} className={btnPrimary('bg-yellow-500 hover:bg-yellow-600')}>
          {loading ? 'Atualizando...' : '🌸 Iniciar Montagem'}
        </button>
      )}

      {(status === 'approved' || status === 'preparing') && (
        <button onClick={() => mudarStatus('ready')} disabled={loading} className={btnSecondary}>
          {loading ? 'Atualizando...' : '📦 Marcar como Pronto para Envio'}
        </button>
      )}

      {status === 'ready' && (
        <div className="space-y-2">
          <input type="text" value={motoboy} onChange={(e) => setMotoboy(e.target.value)} placeholder="Nome do motoboy" className={inputCls} />
          <button onClick={marcarEnviado} disabled={loading || !motoboy.trim()} className={btnPrimary('bg-orange-500 hover:bg-orange-600')}>
            {loading ? 'Despachando...' : '🏍 Marcar como Enviado'}
          </button>
        </div>
      )}

      {status === 'available_for_pickup' && (
        <div className="space-y-2">
          <input type="text" value={recebidoPor} onChange={(e) => setRecebidoPor(e.target.value)} placeholder="Retirado por" className={inputCls} />
          <button onClick={marcarEntregue} disabled={loading || !recebidoPor.trim()} className={btnPrimary('bg-purple-600 hover:bg-purple-700')}>
            {loading ? 'Confirmando...' : '🏪 Confirmar Retirada'}
          </button>
        </div>
      )}

      {status === 'dispatched' && (
        <div className="space-y-2">
          <input type="text" value={motoboy} onChange={(e) => setMotoboy(e.target.value)} placeholder="Nome do motoboy" className={inputCls} />
          <input type="text" value={recebidoPor} onChange={(e) => setRecebidoPor(e.target.value)} placeholder="Recebido por" className={inputCls} />
          <button onClick={marcarEntregue} disabled={loading || !recebidoPor.trim()} className={btnPrimary('bg-green-600 hover:bg-green-700')}>
            {loading ? 'Confirmando...' : '✓ Confirmar Entrega'}
          </button>
        </div>
      )}

      {!['delivered', 'cancelled', 'undelivered'].includes(status) && (
        <button onClick={() => mudarStatus('cancelled')} disabled={loading} className={btnDanger}>
          Cancelar pedido
        </button>
      )}

      {status === 'delivered' && (
        <p className="text-center text-sm text-gray-400 py-2">Pedido já entregue</p>
      )}
    </div>
  )
}


// ── Page ──────────────────────────────────────────────────────────────────────

export default function PainelPage() {
  const today = todayFormatted()

  const abertoHook = useOrders('pending')
  const pagoHook = useOrders('approved')
  const montandoHook = useOrders('preparing')
  const prontoHook = useOrders('ready')
  const retiradaHook = useOrders('available_for_pickup')
  const enviadoHook = useOrders('dispatched')
  const entregueHook = useOrders('delivered')

  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const pagoMontandoAll = [...pagoHook.orders, ...montandoHook.orders]
  const pagoMontandoLoading = pagoHook.loading || montandoHook.loading
  const pagoMontandoError = pagoHook.error || montandoHook.error

  const totalCount = abertoHook.orders.length + pagoMontandoAll.length +
    prontoHook.orders.length + retiradaHook.orders.length + enviadoHook.orders.length + entregueHook.orders.length

  function refreshAll() {
    abertoHook.refresh()
    pagoHook.refresh()
    montandoHook.refresh()
    prontoHook.refresh()
    retiradaHook.refresh()
    enviadoHook.refresh()
    entregueHook.refresh()
  }

  const allHooks = [abertoHook, pagoHook, montandoHook, prontoHook, retiradaHook, enviadoHook, entregueHook]
  const anyLoading = allHooks.some((h) => h.loading)

  const lastUpdate = allHooks.reduce<Date | null>((best, h) => {
    if (!h.lastUpdate) return best
    return !best || h.lastUpdate > best ? h.lastUpdate : best
  }, null)

  const nextRefreshAt = allHooks.reduce<number | null>((soonest, h) => {
    if (!h.nextRefreshAt) return soonest
    return !soonest || h.nextRefreshAt < soonest ? h.nextRefreshAt : soonest
  }, null)

  const colunas = [
    { key: 'pending',       titulo: 'Em Aberto',          cor: 'bg-gray-100 text-gray-600',      orders: abertoHook.orders,  loading: abertoHook.loading,  error: abertoHook.error,  showStatus: false, dimCards: true },
    { key: 'pago_montando',titulo: 'Pago / Em montagem',  cor: 'bg-yellow-100 text-yellow-700',  orders: pagoMontandoAll,    loading: pagoMontandoLoading, error: pagoMontandoError, showStatus: true,  dimCards: false },
    { key: 'ready',                titulo: 'Pronto para Envio',        cor: 'bg-blue-100 text-blue-700',    orders: prontoHook.orders,   loading: prontoHook.loading,   error: prontoHook.error,   showStatus: false, dimCards: false },
    { key: 'available_for_pickup', titulo: 'Disponível para Retirada', cor: 'bg-purple-100 text-purple-700', orders: retiradaHook.orders, loading: retiradaHook.loading, error: retiradaHook.error, showStatus: false, dimCards: false },
    { key: 'dispatched',           titulo: 'Enviado',                  cor: 'bg-orange-100 text-orange-700', orders: enviadoHook.orders,  loading: enviadoHook.loading,  error: enviadoHook.error,  showStatus: false, dimCards: false },
    { key: 'delivered',     titulo: 'Entregue (hoje)',     cor: 'bg-green-100 text-green-800',    orders: entregueHook.orders,loading: entregueHook.loading,error: entregueHook.error,showStatus: false, dimCards: false },
  ]

  return (
    <div>
      <PainelTopBar
        totalCount={totalCount}
        lastUpdate={lastUpdate}
        nextRefreshAt={nextRefreshAt}
        onRefresh={refreshAll}
        loading={anyLoading}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((v) => !v)}
      />

      {searchOpen && <BuscaPedidoPanel onClose={() => setSearchOpen(false)} />}

      <div className="lg:flex lg:gap-2 lg:items-stretch" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {colunas.map((col) => (
          <OrderList
            key={col.key}
            title={col.titulo}
            badgeCls={col.cor}
            orders={col.orders}
            loading={col.loading}
            error={col.error}
            onOpenOrder={setDrawerOrderId}
            showStatus={col.showStatus}
            dimCards={col.dimCards}
          />
        ))}
      </div>

      {drawerOrderId !== null && (
        <OrderDrawer
          id={drawerOrderId}
          onClose={() => setDrawerOrderId(null)}
          footer={(order) => <AdminPainelActions order={order} onClose={() => setDrawerOrderId(null)} />}
        />
      )}
    </div>
  )
}
