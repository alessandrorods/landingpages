'use client'

import { useState } from 'react'
import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  close: () => void
}

export function DrawerActionDeliver({ order, close }: Props) {
  const { loading, err, run } = useDrawerAction()
  const [receivedBy, setReceivedBy] = useState(order.recipientName)

  async function deliver() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recebidoPor: receivedBy.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao confirmar entrega')
      close()
    })
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={receivedBy}
        onChange={(e) => setReceivedBy(e.target.value)}
        placeholder="Nome de quem recebeu"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={deliver}
        disabled={loading || !receivedBy.trim()}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl text-base transition-colors"
      >
        {loading ? 'Registrando...' : '✓ Confirmar Entrega'}
      </button>
    </div>
  )
}
