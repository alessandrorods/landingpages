'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { OrderList } from '@/components/order/OrderList'
import OrderDrawer from '@/components/order/OrderDrawer'
import { OrderSearch } from '@/components/order/OrderSearch'

export default function FloristaPage() {
  const aprovadoHook = useOrders('approved')
  const montandoHook = useOrders('preparing')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  function refresh() {
    aprovadoHook.refresh()
    montandoHook.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Montagem</h1>
        <OrderSearch variant="modal" accentColor="pink" />
      </div>

      <OrderList
        title="Em montagem"
        badgeCls="bg-pink-100 text-pink-700"
        orders={montandoHook.orders}
        loading={montandoHook.loading}
        error={montandoHook.error}
        onOpenOrder={(id) => setSelectedId(id)}
        accent="pink"
        cta="Montar ›"
        defaultOpen
      />

      <OrderList
        title="Prontos para montar"
        badgeCls="bg-pink-100 text-pink-700"
        orders={aprovadoHook.orders}
        loading={aprovadoHook.loading}
        error={aprovadoHook.error}
        onOpenOrder={(id) => setSelectedId(id)}
        accent="pink"
        cta="Montar ›"
        defaultOpen
      />

      {selectedId !== null && (
        <OrderDrawer
          id={selectedId}
          onClose={() => { setSelectedId(null); refresh() }}
        />
      )}
    </div>
  )
}
