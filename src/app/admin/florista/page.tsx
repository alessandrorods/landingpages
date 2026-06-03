'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { OrderList } from '@/components/order/OrderList'
import OrderDrawer from '@/components/order/OrderDrawer'

export default function FloristaPage() {
  const { orders, loading, error, refresh } = useOrders('approved')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Montagem</h1>

      <OrderList
        title="Em montagem"
        badgeCls="bg-pink-100 text-pink-700"
        orders={orders}
        loading={loading}
        error={error}
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
