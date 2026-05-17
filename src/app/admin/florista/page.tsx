'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { OrderList } from '@/components/order/OrderList'
import OrderDrawer from '@/components/order/OrderDrawer'
import { PrintOverlay } from '@/components/order/PrintOverlay'
import type { OrderDTO } from '@/domains/orders/order.types'

function MontadoAction({
  order,
  onMontado,
  onRefresh,
}: {
  order: OrderDTO
  onMontado: (id: number) => void
  onRefresh: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [printing, setPrinting] = useState(false)

  async function iniciarMontagem() {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'preparing' }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErr(d.error ?? 'Erro ao atualizar')
        return
      }
      setPrinting(true)
      void onRefresh()
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  async function marcarMontado() {
    setLoading(true)
    setErr('')
    const nextStatus = order.pickup ? 'available_for_pickup' : 'ready'
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: nextStatus }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErr(d.error ?? 'Erro ao atualizar')
        return
      }
      setDone(true)
      setTimeout(() => onMontado(order.id), 800)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <p className="text-center text-green-700 font-semibold py-3">✓ Marcado como montado!</p>
  }

  return (
    <>
      {printing && <PrintOverlay order={order} onClose={() => setPrinting(false)} />}
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}

      {order.status === 'approved' && (
        <button
          onClick={iniciarMontagem}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
        >
          {loading ? 'Atualizando...' : '🌸 Iniciar Montagem'}
        </button>
      )}

      {order.status === 'preparing' && (
        <button
          onClick={marcarMontado}
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
        >
          {loading ? 'Atualizando...' : order.pickup ? '✓ Montado — Disponível para retirada' : '✓ Montado — passar para Expedição'}
        </button>
      )}
    </>
  )
}

export default function FloristaPage() {
  const { orders, loading, error, refresh } = useOrders('approved')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [removidos, setRemovidos] = useState<Set<number>>(new Set())

  const visiveis = orders.filter((o) => !removidos.has(o.id))

  function remover(id: number) {
    setSelectedId(null)
    setRemovidos((prev) => new Set([...prev, id]))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Montagem</h1>

      <OrderList
        title="Em montagem"
        badgeCls="bg-pink-100 text-pink-700"
        orders={visiveis}
        loading={loading}
        error={error}
        onOpenOrder={(id) => setSelectedId(id)}
        accent="pink"
        cta="Montar ›"
        defaultOpen
      />

      {selectedId !== null && (
        <OrderDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          footer={(order, refresh) => <MontadoAction order={order} onMontado={remover} onRefresh={refresh} />}
        />
      )}
    </div>
  )
}
