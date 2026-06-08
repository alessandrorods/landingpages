'use client'

import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  refresh: () => Promise<void>
}

export function DrawerActionApprove({ order, refresh }: Props) {
  const { loading, err, run } = useDrawerAction()

  async function approve() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'approved' }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao atualizar')
      await refresh()
    })
  }

  return (
    <div className="space-y-2">
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={approve}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Atualizando...' : '✓ Marcar como Pago'}
      </button>
    </div>
  )
}
