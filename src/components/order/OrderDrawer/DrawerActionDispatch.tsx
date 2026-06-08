'use client'

import { useState } from 'react'
import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  close: () => void
}

export function DrawerActionDispatch({ order, close }: Props) {
  const { loading, err, run } = useDrawerAction()
  const [courierName, setCourierName] = useState(order.courierName ?? '')

  async function dispatch() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierName: courierName.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao despachar')
      close()
    })
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={courierName}
        onChange={(e) => setCourierName(e.target.value)}
        placeholder="Nome do motoboy"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={dispatch}
        disabled={loading || !courierName.trim()}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Despachando...' : '🏍 Marcar como Enviado'}
      </button>
    </div>
  )
}
