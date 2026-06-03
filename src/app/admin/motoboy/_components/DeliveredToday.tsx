'use client'

import { useState, useEffect } from 'react'
import type { OrderDTO } from '@/domains/orders/order.types'

export function DeliveredToday({ refreshTrigger }: { refreshTrigger?: number }) {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/motoboy/delivered-today')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
  }, [refreshTrigger])

  if (orders.length === 0) return null

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide"
      >
        <span>Entregue hoje ({orders.length})</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && orders.map((o) => (
        <div key={o.id} className="bg-gray-50 rounded-2xl p-4 mb-2 opacity-60">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold font-mono text-gray-500">#{o.id}</span>
            {o.deliveryDate && <span className="text-xs text-gray-400">{o.deliveryDate}</span>}
          </div>
          <p className="text-sm text-gray-600">{o.recipientName}</p>
          {o.items[0] && <p className="text-xs text-gray-400 mt-0.5">{o.items[0].name}</p>}
        </div>
      ))}
    </div>
  )
}
