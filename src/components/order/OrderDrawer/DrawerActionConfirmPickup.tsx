'use client'

import { useState } from 'react'
import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  close: () => void
}

export function DrawerActionConfirmPickup({ order, close }: Props) {
  const { loading, err, run } = useDrawerAction()
  const [receivedBy, setReceivedBy] = useState(order.recipientName)

  async function confirmPickup() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recebidoPor: receivedBy.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao confirmar retirada')
      close()
    })
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={receivedBy}
        onChange={(e) => setReceivedBy(e.target.value)}
        placeholder="Nome de quem retirou"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={confirmPickup}
        disabled={loading || !receivedBy.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Confirmando...' : '🏪 Confirmar Retirada'}
      </button>
    </div>
  )
}
