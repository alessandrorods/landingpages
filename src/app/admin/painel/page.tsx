'use client'

import { useState, useEffect } from 'react'
import { useOrders } from '@/hooks/useOrders'
import OrderDrawer from '@/components/order/OrderDrawer'
import { OrderList } from '@/components/order/OrderList'
import { OrderSearch } from '@/components/order/OrderSearch'
import { useUser } from '@/contexts/UserContext'

// ── Barra de topo ─────────────────────────────────────────────────────────────

function PainelTopBar({
  totalCount,
  lastUpdate,
  nextRefreshAt,
  onRefresh,
  loading,
}: {
  totalCount: number
  lastUpdate: Date | null
  nextRefreshAt: number | null
  onRefresh: () => void
  loading: boolean
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
    <div className="flex items-center gap-2 flex-wrap">
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
      <OrderSearch variant="modal" accentColor="purple" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function FilaLink() {
  const role = useUser()?.role
  if (!['expedicao', 'admin'].includes(role ?? '')) return null
  return (
    <a
      href="/admin/fila"
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-xl px-3 py-2 transition-colors bg-blue-50 hover:bg-blue-100"
    >
      Fila de despacho
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  )
}

export default function PainelPage() {
  const abertoHook = useOrders('pending')
  const pagoHook = useOrders('approved')
  const montandoHook = useOrders('preparing')
  const prontoHook = useOrders('ready')
  const retiradaHook = useOrders('available_for_pickup')
  const enviadoHook = useOrders('dispatched')
  const entregueHook = useOrders('delivered', { todayOnly: true })
  const naoEntregueHook = useOrders('undelivered')

  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null)

  const pagoMontandoAll = [...pagoHook.orders, ...montandoHook.orders]
  const pagoMontandoLoading = pagoHook.loading || montandoHook.loading
  const pagoMontandoError = pagoHook.error || montandoHook.error

  const totalCount = abertoHook.orders.length + pagoMontandoAll.length +
    prontoHook.orders.length + retiradaHook.orders.length + enviadoHook.orders.length +
    entregueHook.orders.length + naoEntregueHook.orders.length

  function refreshAll() {
    abertoHook.refresh()
    pagoHook.refresh()
    montandoHook.refresh()
    prontoHook.refresh()
    retiradaHook.refresh()
    enviadoHook.refresh()
    entregueHook.refresh()
    naoEntregueHook.refresh()
  }

  const allHooks = [abertoHook, pagoHook, montandoHook, prontoHook, retiradaHook, enviadoHook, entregueHook, naoEntregueHook]
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
    { key: 'delivered',     titulo: 'Entregue (hoje)',     cor: 'bg-green-100 text-green-800',    orders: entregueHook.orders,    loading: entregueHook.loading,    error: entregueHook.error,    showStatus: false, dimCards: false },
    { key: 'undelivered',   titulo: 'Não entregue',        cor: 'bg-red-100 text-red-700',        orders: naoEntregueHook.orders, loading: naoEntregueHook.loading, error: naoEntregueHook.error, showStatus: false, dimCards: false },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <PainelTopBar
            totalCount={totalCount}
            lastUpdate={lastUpdate}
            nextRefreshAt={nextRefreshAt}
            onRefresh={refreshAll}
            loading={anyLoading}
          />
        </div>
        <FilaLink />
      </div>

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
          onClose={() => { setDrawerOrderId(null); refreshAll() }}
        />
      )}
    </div>
  )
}
