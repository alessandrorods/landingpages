'use client'

import { useState } from 'react'
import { OrderCard } from '@/components/order/OrderCard'
import { STATUS_BADGE } from '@/constants/orderDisplay'
import type { OrderDTO } from '@/domains/orders/order.types'

type Accent = 'pink' | 'orange' | 'green' | 'blue' | 'purple' | 'gray'

export interface OrderListProps {
  title: string
  badgeCls: string
  orders: OrderDTO[]
  loading: boolean
  error: string
  onOpenOrder: (id: number) => void
  accent?: Accent
  cta?: string
  showStatus?: boolean
  dimCards?: boolean
  defaultOpen?: boolean
  // Card content factories — allow pages to customize what each card shows
  primary?: (order: OrderDTO) => string
  secondary?: (order: OrderDTO) => string | undefined
  tag?: (order: OrderDTO) => string | undefined
  badge?: (order: OrderDTO) => React.ReactNode | undefined
}

export function OrderList({
  title,
  badgeCls,
  orders,
  loading,
  error,
  onOpenOrder,
  accent = 'purple',
  cta = 'Ver detalhes ›',
  showStatus = false,
  dimCards = false,
  defaultOpen = false,
  primary,
  secondary,
  tag,
  badge,
}: OrderListProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState(defaultOpen)

  const count = loading ? '…' : orders.length

  const loadingSkeleton = (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
      ))}
    </div>
  )

  const cards = orders.map((order) => (
    <OrderCard
      key={order.id}
      order={order}
      onOpen={() => onOpenOrder(order.id)}
      accent={accent}
      cta={cta}
      dimmed={dimCards}
      primary={primary?.(order)}
      secondary={secondary?.(order)}
      tag={tag?.(order)}
      badge={badge
        ? badge(order)
        : showStatus
          ? (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_BADGE[order.status]?.label ?? order.status}
            </span>
          )
          : undefined}
    />
  ))

  return (
    <div className={`lg:flex lg:flex-col ${collapsed ? 'lg:w-12 lg:flex-none' : 'lg:flex-1 lg:min-w-0'} transition-all duration-200`}>

      {/* ── Desktop: column ── */}
      <div className="hidden lg:flex flex-col h-full">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            title={title}
            className="w-full h-full flex flex-col items-center gap-3 bg-gray-100 hover:bg-gray-200 rounded-xl pt-3 pb-4 px-1 transition-colors"
          >
            <span className="text-gray-400 text-base leading-none">›</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${badgeCls}`}>{count}</span>
            <span
              className="text-xs font-semibold text-gray-400 mt-1"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {title}
            </span>
          </button>
        ) : (
          <div className="flex flex-col h-full bg-white rounded-xl p-3">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-gray-800 truncate flex-1">{title}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeCls}`}>{count}</span>
              <button
                onClick={() => setCollapsed(true)}
                title="Colapsar"
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 leading-none text-base"
              >
                ‹
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading && loadingSkeleton}
              {!loading && error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
              {!loading && !error && orders.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhum pedido</p>}
              {!loading && !error && cards}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: accordion ── */}
      <div className="lg:hidden border border-gray-100 rounded-2xl bg-white shadow-sm mb-3 overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-800">{title}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>{count}</span>
          </div>
          <span className="text-gray-400 text-lg leading-none ml-2">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="px-4 pb-4">
            {loading && loadingSkeleton}
            {!loading && error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
            {!loading && !error && orders.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum pedido</p>}
            {!loading && !error && cards}
          </div>
        )}
      </div>

    </div>
  )
}
