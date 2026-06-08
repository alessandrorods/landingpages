'use client'

import { useState, useEffect } from 'react'
import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'
import type { PeriodoEntrega } from '@/constants/pedido.types'

interface Props {
  order: OrderDTO
  close: () => void
}

function toInputDate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split('/')
  return `${yyyy}-${mm}-${dd}`
}

function fromInputDate(yyyymmdd: string): string {
  const [yyyy, mm, dd] = yyyymmdd.split('-')
  return `${dd}/${mm}/${yyyy}`
}

export function DrawerActionReschedule({ order, close }: Props) {
  const { loading, err, run } = useDrawerAction()
  const [date, setDate] = useState(toInputDate(order.deliveryDate))
  const [period, setPeriod] = useState(order.deliveryPeriod ?? '')
  const [periods, setPeriods] = useState<PeriodoEntrega[]>([])

  useEffect(() => {
    fetch('/api/admin/config/delivery-periods')
      .then((r) => r.json())
      .then((d) => {
        const list = d.periods as PeriodoEntrega[] | undefined
        if (list?.length) setPeriods(list.sort((a, b) => a.sortOrder - b.sortOrder))
      })
      .catch(() => {})
  }, [])

  async function submit() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryDate: fromInputDate(date),
          deliveryPeriod: period || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao reagendar')
      close()
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reagendar entrega</p>
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        {periods.length > 0 && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
          >
            <option value="">Sem período</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        )}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={submit}
        disabled={loading || !date}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Reagendando...' : 'Devolver à fila'}
      </button>
    </div>
  )
}
