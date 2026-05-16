'use client'

import { useState } from 'react'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  onDelivered: () => void
}

export function DeliveryAction({ order, onDelivered }: Props) {
  const [receivedBy, setReceivedBy] = useState(order.recipientName)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function confirm() {
    if (!receivedBy.trim()) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recebidoPor: receivedBy.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErr(d.error ?? 'Erro ao confirmar entrega')
        return
      }
      setDone(true)
      setTimeout(onDelivered, 800)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <p className="text-center text-orange-700 font-semibold py-3">✓ Entrega confirmada!</p>
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Recebido por
        </label>
        <input
          type="text"
          value={receivedBy}
          onChange={(e) => setReceivedBy(e.target.value)}
          placeholder="Nome de quem recebeu"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
        />
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}

      <button
        onClick={confirm}
        disabled={loading || !receivedBy.trim()}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {loading ? 'Registrando...' : '✓ Confirmar Entrega'}
      </button>
    </div>
  )
}
