'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { IoPauseCircleOutline, IoAddCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5'
import { buildDispatchQueue, isExternalOrder, type QueueGroup, type QueueOrder, type DeliveryRegion } from '@/domains/orders/dispatch-queue'
import type { OrderDTO } from '@/domains/orders/order.types'
import type { ExternalDispatchOrderDTO } from '@/domains/orders/external-order.types'
import type { PeriodoEntrega } from '@/constants/pedido.types'
import { EXTERNAL_PLATFORM_LABELS } from '@/constants/orderDisplay'
import { AddExternalOrderModal } from './AddExternalOrderModal'
import { DispatchExternalOrderModal } from './DispatchExternalOrderModal'

const POLL_SECONDS = 30
const AT_RISK_WINDOW_MINUTES = 60

interface ApiResponse {
  orders: QueueOrder[]
  inRoute: OrderDTO[]
  undelivered: OrderDTO[]
  regions: DeliveryRegion[]
  periods: PeriodoEntrega[]
}

interface CourierGroup {
  courierName: string
  orders: OrderDTO[]
}

type RiskLevel = 'delayed' | 'at-risk' | 'ok'

function todayFormatted(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function computeRisk(group: QueueGroup, now: Date): RiskLevel {
  if (group.date !== todayFormatted()) return 'ok'
  if (!group.deliveryLimitHour) return 'ok'
  const [h, m] = group.deliveryLimitHour.split(':').map(Number)
  const limitMin = h * 60 + m
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin >= limitMin) return 'delayed'
  if (nowMin >= limitMin - AT_RISK_WINDOW_MINUTES) return 'at-risk'
  return 'ok'
}

function buildCourierGroups(orders: OrderDTO[]): CourierGroup[] {
  const map = new Map<string, OrderDTO[]>()
  for (const order of orders) {
    const name = order.courierName ?? 'Sem motoboy'
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(order)
  }
  return [...map.entries()]
    .map(([courierName, orders]) => ({ courierName, orders }))
    .sort((a, b) => a.courierName.localeCompare(b.courierName))
}

const RISK_STYLES: Record<RiskLevel, { card: string; header: string; badge: string; label: string }> = {
  delayed:   { card: 'border-red-300',   header: 'bg-red-600 text-white',   badge: 'bg-red-500 text-white',       label: 'Em atraso'       },
  'at-risk': { card: 'border-amber-300', header: 'bg-amber-500 text-white', badge: 'bg-amber-400 text-amber-950', label: 'Risco de atraso' },
  ok:        { card: 'border-gray-200',  header: 'bg-gray-200 text-black',  badge: 'bg-gray-300 text-gray-800',   label: ''                },
}

export default function FilaPage() {
  const [groups, setGroups] = useState<QueueGroup[]>([])
  const [inRoute, setInRoute] = useState<OrderDTO[]>([])
  const [undelivered, setUndelivered] = useState<OrderDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(POLL_SECONDS)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [todayOnly, setTodayOnly] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [showAddExternal, setShowAddExternal] = useState(false)
  const [dispatchingExternal, setDispatchingExternal] = useState<ExternalDispatchOrderDTO | null>(null)
  const countdownRef = useRef(POLL_SECONDS)
  const pausedRef = useRef(false)
  const bufferRef = useRef<{ groups: QueueGroup[]; inRoute: OrderDTO[]; undelivered: OrderDTO[] } | null>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await fetch('/api/admin/orders/dispatch-queue')
      if (!res.ok) { setError('Erro ao carregar fila'); return }
      const data: ApiResponse = await res.json()
      const newGroups = buildDispatchQueue(data.orders, data.regions, data.periods)
      countdownRef.current = POLL_SECONDS
      setCountdown(POLL_SECONDS)
      if (pausedRef.current) {
        bufferRef.current = { groups: newGroups, inRoute: data.inRoute, undelivered: data.undelivered ?? [] }
      } else {
        setGroups(newGroups)
        setInRoute(data.inRoute)
        setUndelivered(data.undelivered ?? [])
        setLastUpdatedAt(new Date())
        bufferRef.current = null
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [])

  function togglePause() {
    const next = !paused
    setPaused(next)
    pausedRef.current = next
    if (!next && bufferRef.current) {
      setGroups(bufferRef.current.groups)
      setInRoute(bufferRef.current.inRoute)
      setUndelivered(bufferRef.current.undelivered)
      setLastUpdatedAt(new Date())
      bufferRef.current = null
    }
  }

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const poll = setInterval(load, POLL_SECONDS * 1000)
    return () => clearInterval(poll)
  }, [load])
  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1)
      setCountdown(countdownRef.current)
    }, 1000)
    return () => clearInterval(tick)
  }, [])
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const now = new Date()
  const today = todayFormatted()
  const visibleGroups = todayOnly ? groups.filter((g) => g.date === today) : groups
  const totalOrders = visibleGroups.reduce((s, g) => s + g.orders.length, 0)
  const courierGroups = buildCourierGroups(inRoute)

  return (
    <div className="-mx-4 -mt-4 min-h-[calc(100vh-3.5rem)] bg-gray-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">Fila de Despacho</h1>
          {!loading && (
            <span className="text-base font-bold text-gray-400">
              {totalOrders} {totalOrders === 1 ? 'pedido' : 'pedidos'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {error && <span className="text-sm font-semibold text-red-500">{error}</span>}

          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
            <button type="button" onClick={() => setTodayOnly(true)}
              className={`px-4 py-2 transition-colors ${todayOnly ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              Hoje
            </button>
            <button type="button" onClick={() => setTodayOnly(false)}
              className={`px-4 py-2 transition-colors ${!todayOnly ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              Todos
            </button>
          </div>

          {lastUpdatedAt && !paused && (
            <span className="text-sm text-gray-400 hidden xl:block">
              {lastUpdatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}

          <button type="button" onClick={load} disabled={paused}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 hover:border-gray-400 rounded-lg px-4 py-2 transition-colors">
            Atualizar
          </button>

          <button type="button" onClick={() => setShowAddExternal(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 rounded-lg px-4 py-2 transition-colors bg-purple-50 hover:bg-purple-100">
            <IoAddCircleOutline className="w-4 h-4" />
            Pedido Externo
          </button>

          {/* Pause toggle */}
          <button type="button" onClick={togglePause}
            className={`group flex items-center gap-2 text-sm font-bold rounded-lg px-4 py-2 transition-colors border ${
              paused
                ? 'animate-pulse bg-red-600 border-red-600 text-white hover:bg-red-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 min-w-[100px] justify-center'
            }`}>
            {paused ? (
              'Atualização Pausada'
            ) : (
              <>
                <span className="group-hover:hidden tabular-nums">↺ {countdown}s</span>
                <span className="hidden group-hover:flex items-center gap-1.5">
                  <IoPauseCircleOutline className="w-4 h-4" />
                  Pausar
                </span>
              </>
            )}
          </button>

          <button type="button" onClick={toggleFullscreen} title={isFullscreen ? 'Sair do fullscreen' : 'Fullscreen'}
            className="text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-lg px-3 py-2 transition-colors">
            {isFullscreen
              ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
          <Clock />
        </div>
      </div>

      {/* ── Queue grid ── */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          </div>
        )}

        {!loading && visibleGroups.length === 0 && !error && (
          <div className="flex items-center justify-center h-48">
            <p className="text-xl font-bold text-gray-400">
              {todayOnly ? 'Nenhum pedido para despacho hoje' : 'Nenhum pedido para despacho'}
            </p>
          </div>
        )}

        {visibleGroups.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {visibleGroups.map((group) => (
              <GroupCard key={group.key} group={group} risk={computeRisk(group, now)} onDispatchExternal={setDispatchingExternal} />
            ))}
          </div>
        )}
      </div>

      {/* ── Em Rota ── */}
      {!loading && courierGroups.length > 0 && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Em Rota — {inRoute.length} {inRoute.length === 1 ? 'pedido' : 'pedidos'}
          </p>
          <div className="flex gap-6 overflow-x-auto pb-1">
            {courierGroups.map((cg) => (
              <div key={cg.courierName} className="shrink-0 border-r border-gray-200 pr-6 last:border-r-0 last:pr-0">
                <p className="text-sm font-black text-gray-800 mb-2">{cg.courierName}</p>
                <div className="space-y-1">
                  {cg.orders.map((order) => (
                    <div key={order.id} className="flex items-baseline gap-2">
                      <span className="text-base font-black text-gray-900 tabular-nums">#{order.id}</span>
                      <span className="text-sm text-gray-500 truncate max-w-[160px]">{order.neighborhood}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Não entregues ── */}
      {!loading && undelivered.length > 0 && (
        <div className="shrink-0 border-t-2 border-red-200 bg-red-50 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">
            Não entregues — aguardando reagendamento — {undelivered.length} {undelivered.length === 1 ? 'pedido' : 'pedidos'}
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {undelivered.map((order) => (
              <div key={order.id} className="shrink-0 bg-white border border-red-200 rounded-xl px-4 py-3 min-w-[180px]">
                <p className="text-xl font-black text-red-700 tabular-nums">#{order.id}</p>
                <p className="text-sm font-semibold text-gray-700 truncate mt-0.5">{order.neighborhood}</p>
                <p className="text-xs text-gray-400 truncate">{order.recipientName}</p>
                {order.courierName && (
                  <p className="text-xs text-red-400 mt-1">Motoboy: {order.courierName}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddExternal && (
        <AddExternalOrderModal onClose={() => setShowAddExternal(false)} onCreated={load} />
      )}

      {dispatchingExternal && (
        <DispatchExternalOrderModal
          order={dispatchingExternal}
          onClose={() => setDispatchingExternal(null)}
          onDispatched={load}
        />
      )}
    </div>
  )
}

function GroupCard({ group, risk, onDispatchExternal }: { group: QueueGroup; risk: RiskLevel; onDispatchExternal: (order: ExternalDispatchOrderDTO) => void }) {
  const styles = RISK_STYLES[risk]
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col ${styles.card}`}>
      <div className={`${styles.header} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {risk !== 'ok' && (
              <p className="text-xs font-black uppercase tracking-widest opacity-90 mb-1">⚠ {styles.label}</p>
            )}
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">{group.date}</p>
            <p className="text-xl font-black leading-tight mt-0.5 truncate">{group.periodLabel || group.period}</p>
            <p className="text-sm font-semibold mt-1 opacity-80 truncate">{group.regionLabel}</p>
          </div>
          <div className={`${styles.badge} rounded-xl px-3 py-2 text-center shrink-0`}>
            <p className="text-3xl font-black leading-none">{group.orders.length}</p>
            <p className="text-[10px] font-bold uppercase mt-0.5 opacity-75">
              {group.orders.length === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {group.orders.map((order) => (
          <OrderRow key={`${isExternalOrder(order) ? 'ext' : 'order'}-${order.id}`} order={order} onDispatchExternal={onDispatchExternal} />
        ))}
      </div>
    </div>
  )
}

function OrderRow({ order, onDispatchExternal }: { order: QueueOrder; onDispatchExternal: (order: ExternalDispatchOrderDTO) => void }) {
  if (isExternalOrder(order)) {
    return (
      <div className="px-5 py-3 flex items-center gap-4">
        <span className="text-xl font-black text-gray-900 tabular-nums shrink-0">#{order.externalNumber}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-700 truncate leading-tight">{order.neighborhood ?? '—'}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-purple-500 truncate">{EXTERNAL_PLATFORM_LABELS[order.platform]}</p>
        </div>
        <button
          type="button"
          onClick={() => onDispatchExternal(order)}
          title="Marcar como despachado"
          className="shrink-0 text-gray-300 hover:text-orange-500 transition-colors p-1"
        >
          <IoCheckmarkCircleOutline className="w-5 h-5" />
        </button>
      </div>
    )
  }
  return (
    <div className="px-5 py-3 flex items-center gap-4">
      <span className="text-xl font-black text-gray-900 tabular-nums shrink-0">#{order.id}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-700 truncate leading-tight">{order.neighborhood}</p>
        <p className="text-xs text-gray-400 truncate">{order.recipientName}</p>
      </div>
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setTime(fmt())
    const t = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="text-2xl font-mono font-black tabular-nums text-gray-900">{time}</span>
}
