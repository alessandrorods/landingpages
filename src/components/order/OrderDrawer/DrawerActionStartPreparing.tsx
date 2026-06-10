'use client'

import { useState } from 'react'
import { useDrawerAction } from './useDrawerAction'
import { PrintOverlay } from '@/components/order/PrintOverlay'
import { useDeliveryPeriods } from '@/hooks/useDeliveryPeriods'
import { useDeliveryRegions } from '@/hooks/useDeliveryRegions'
import type { OrderDTO } from '@/domains/orders/order.types'

interface Props {
  order: OrderDTO
  refresh: () => Promise<void>
}

export function DrawerActionStartPreparing({ order, refresh }: Props) {
  const { loading, err, run } = useDrawerAction()
  const { periods, loading: periodsLoading } = useDeliveryPeriods()
  const { regions, loading: regionsLoading } = useDeliveryRegions()
  const [printing, setPrinting] = useState(false)

  async function startPreparing() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao: 'preparing' }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao atualizar')
      setPrinting(true)
      void refresh()
    })
  }

  return (
    <div className="space-y-2">
      {printing && (
        <PrintOverlay
          order={order}
          regions={regions}
          periods={periods}
          loading={periodsLoading || regionsLoading}
          onClose={() => setPrinting(false)}
        />
      )}
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
