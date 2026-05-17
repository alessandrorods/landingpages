'use client'

import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  close: () => void
}

export function DrawerActionMarkReady({ order, close }: Props) {
  const { loading, err, run } = useDrawerAction()

  const nextStatus = order.pickup ? 'available_for_pickup' : 'ready'
  const label = order.pickup ? '✓ Montado — Disponível para retirada' : '✓ Montado — passar para Expedição'

  async function markReady() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: nextStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao atualizar')
      close()
    })
  }

  return (
    <div className="space-y-2">
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={markReady}
        disabled={loading}
        className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Atualizando...' : label}
      </button>
    </div>
  )
}
