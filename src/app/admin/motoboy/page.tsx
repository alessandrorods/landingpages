'use client'

import { useState } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { useUser } from '@/contexts/UserContext'
import StatusBar from '@/app/admin/components/StatusBar'
import EmptyState from '@/app/admin/components/EmptyState'
import OrderDrawer from '@/components/OrderDrawer'
import { OrderCard } from '@/components/OrderCard'
import { CollectOrder } from './_components/CollectOrder'
import { DeliveryAction } from './_components/DeliveryAction'
import { DeliveredToday } from './_components/DeliveredToday'
import type { OrderDTO } from '@/domains/orders/order.types'

export default function MotoboyPage() {
  const user = useUser()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { orders, loading, error, lastUpdate, nextRefreshAt, refresh } = useOrders('dispatched', { courierId: 'me' })

  function handleDelivered(_order: OrderDTO) {
    setSelectedId(null)
    refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Entregas</h1>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Motoboy: <span className="font-semibold text-gray-800">{user?.displayName}</span>
      </p>

      <CollectOrder onCollected={refresh} />

      <StatusBar count={orders.length} lastUpdate={lastUpdate} nextRefreshAt={nextRefreshAt} onRefresh={refresh} loading={loading} />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-28" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{error}</p>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState icon="🎉" message="Nenhuma entrega em rota" />
      )}

      {!loading && orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onOpen={() => setSelectedId(order.id)}
          accent="orange"
          primary={`${order.street}, ${order.streetNumber} — ${order.neighborhood}`}
          secondary={order.items[0]?.name ?? '—'}
          tag={order.recipientName}
          cta="Confirmar entrega ›"
        />
      ))}

      <DeliveredToday />

      {selectedId !== null && (
        <OrderDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          footer={(order) => (
            <DeliveryAction order={order} onDelivered={() => handleDelivered(order)} />
          )}
        />
      )}
    </div>
  )
}
