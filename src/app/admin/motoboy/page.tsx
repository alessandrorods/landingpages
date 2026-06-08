'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { useUser } from '@/contexts/UserContext'
import { OrderList } from '@/components/order/OrderList'
import OrderDrawer from '@/components/order/OrderDrawer'
import { CollectOrder } from './_components/CollectOrder'
import { DeliveredToday } from './_components/DeliveredToday'
import { GeolocationPrompt } from './_components/GeolocationPrompt'

export default function MotoboyPage() {
  const user = useUser()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [deliveredCount, setDeliveredCount] = useState(0)
  const { orders, loading, error, refresh } = useOrders('dispatched', { courierId: 'me' })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Entregas</h1>
      <p className="text-sm text-gray-500 mb-4">
        Motoboy: <span className="font-semibold text-gray-800">{user?.displayName}</span>
      </p>

      <GeolocationPrompt />
      <CollectOrder onCollected={refresh} />

      <OrderList
        title="Em rota"
        badgeCls="bg-orange-100 text-orange-700"
        orders={orders}
        loading={loading}
        error={error}
        onOpenOrder={(id) => setSelectedId(id)}
        accent="orange"
        cta="Confirmar entrega ›"
        defaultOpen
        primary={(o) => `${o.street}, ${o.streetNumber} — ${o.neighborhood}`}
        secondary={(o) => o.items[0]?.name ?? '—'}
        tag={(o) => o.recipientName}
      />

      <DeliveredToday refreshTrigger={deliveredCount} />

      {selectedId !== null && (
        <OrderDrawer
          id={selectedId}
          onClose={() => { setSelectedId(null); setDeliveredCount((c) => c + 1); refresh() }}
        />
      )}
    </div>
  )
}
