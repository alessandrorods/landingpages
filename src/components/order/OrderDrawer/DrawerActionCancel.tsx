'use client'

import { useState } from 'react'
import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  close: () => void
}

export function DrawerActionCancel({ order, close }: Props) {
  const { loading, err, run } = useDrawerAction()
  const [confirm, setConfirm] = useState(false)

  async function cancel() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'cancelled' }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao cancelar')
      close()
    })
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
      >
        Cancelar pedido
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-red-700 font-medium text-center">Tem certeza? Esta ação não pode ser desfeita.</p>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setConfirm(false)}
          className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={cancel}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
        </button>
      </div>
    </div>
  )
}
