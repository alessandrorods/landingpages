'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOrders } from '@/hooks/useOrders'
import StatusBar from '@/components/ui/StatusBar'
import EmptyState from '@/components/ui/EmptyState'
import OrderDrawer from '@/components/order/OrderDrawer'
import { OrderCard } from '@/components/order/OrderCard'
import type { OrderDTO } from '@/domains/orders/order.types'

type Tab = 'pagos' | 'recuperar'

function whatsappMsg(order: OrderDTO): string {
  const produto = order.items[0]?.name ?? 'produto'
  return encodeURIComponent(
    `Olá ${order.buyerName.split(' ')[0]}! Identificamos um problema no pagamento do seu pedido de *${produto}* na Mundo Planta. Podemos te ajudar a concluir a compra?`,
  )
}

function RecuperarAction({ order }: { order: OrderDTO }) {
  const tel = order.buyerPhone.replace(/\D/g, '')
  if (!tel) return <p className="text-sm text-gray-400 text-center">Sem telefone cadastrado</p>
  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/55${tel}?text=${whatsappMsg(order)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-base font-semibold bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-xl transition-colors"
      >
        WhatsApp
      </a>
      <a
        href={`tel:${tel}`}
        className="flex-1 text-center text-base font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-xl transition-colors"
      >
        Ligar
      </a>
    </div>
  )
}

export default function VendasPage() {
  const [tab, setTab] = useState<Tab>('pagos')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const pagos = useOrders('approved')
  const recuperar = useOrders('pending')

  const active = tab === 'pagos' ? pagos : recuperar

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        <Link
          href="/admin/vendas/novo"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + Novo pedido
        </Link>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {([['pagos', 'Pagos', pagos.orders.length], ['recuperar', 'Recuperar', recuperar.orders.length]] as const).map(
          ([t, label, count]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {label}
              {!active.loading && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    tab === t
                      ? t === 'recuperar'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ),
        )}
      </div>

      <StatusBar
        count={active.orders.length}
        lastUpdate={active.lastUpdate}
        nextRefreshAt={active.nextRefreshAt}
        onRefresh={active.refresh}
        loading={active.loading}
      />

      {active.loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-28" />
          ))}
        </div>
      )}

      {!active.loading && active.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{active.error}</p>
      )}

      {!active.loading && !active.error && active.orders.length === 0 && (
        <EmptyState
          icon={tab === 'pagos' ? '✅' : '🎉'}
          message={tab === 'pagos' ? 'Nenhum pedido pago no momento' : 'Nenhum pedido para recuperar'}
        />
      )}

      {!active.loading &&
        active.orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onOpen={() => setSelectedId(order.id)}
            primary={order.buyerName}
            secondary={order.items[0]?.name ?? '—'}
            badge={
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tab === 'pagos' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {tab === 'pagos' ? 'Pago' : 'Pendente'}
              </span>
            }
            cta={tab === 'recuperar' && order.buyerPhone.replace(/\D/g, '') ? 'Tem telefone ›' : 'Ver detalhes ›'}
          />
        ))}

      {selectedId !== null && (
        <OrderDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          footer={tab === 'recuperar' ? (order) => <RecuperarAction order={order} /> : undefined}
        />
      )}
    </div>
  )
}
