'use client'

import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  refresh: () => Promise<void>
}

export function DrawerActionStartPreparing({ order, refresh }: Props) {
  const { loading, err, run } = useDrawerAction()

  async function startPreparing() {
    const printWindow = window.open('about:blank', '_blank')
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'preparing' }),
      })
      if (!res.ok) {
        printWindow?.close()
        throw new Error((await res.json()).error ?? 'Erro ao atualizar')
      }
      if (printWindow) printWindow.location.href = `/print/${order.id}`
      else window.open(`/print/${order.id}`, '_blank')
      void refresh()
    })
  }

  return (
    <div className="space-y-2">
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={startPreparing}
        disabled={loading}
        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Atualizando...' : '🌸 Iniciar Montagem'}
      </button>
    </div>
  )
}
