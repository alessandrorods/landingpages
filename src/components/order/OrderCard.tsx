'use client'

import Image from 'next/image'
import { DeliveryLabel } from './DeliveryLabel'
import type { OrderDTO } from '@/domains/orders/order.types'

type Accent = 'pink' | 'orange' | 'green' | 'blue' | 'purple' | 'gray'

const ACCENT: Record<Accent, { number: string; cta: string }> = {
  pink:   { number: 'bg-pink-50 text-pink-900',    cta: 'text-pink-600' },
  orange: { number: 'bg-orange-50 text-orange-900', cta: 'text-orange-600' },
  green:  { number: 'bg-green-50 text-green-900',   cta: 'text-green-600' },
  blue:   { number: 'bg-blue-50 text-blue-900',     cta: 'text-blue-600' },
  purple: { number: 'bg-purple-50 text-gray-900',   cta: 'text-purple-600' },
  gray:   { number: 'bg-gray-100 text-gray-900',    cta: 'text-gray-600' },
}

interface OrderCardProps {
  order: OrderDTO
  onOpen: () => void
  accent?: Accent
  primary?: string        // linha principal — padrão: order.buyerName
  secondary?: string      // linha secundária opcional
  tag?: string            // chip pequeno (ex: bairro)
  badge?: React.ReactNode // badge no canto do header
  cta: string
  dimmed?: boolean
}

export function OrderCard({
  order,
  onOpen,
  accent = 'gray',
  primary,
  secondary,
  tag,
  badge,
  cta,
  dimmed = false,
}: OrderCardProps) {
  const cls = dimmed
    ? { number: 'bg-gray-100 text-gray-500', cta: 'text-gray-400' }
    : ACCENT[accent]

  return (
    <button
      onClick={onOpen}
      className={`w-full text-left rounded-2xl border p-4 mb-3 active:scale-[0.99] transition-transform ${
        dimmed
          ? 'bg-gray-50 border-gray-100 opacity-50 shadow-none'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xl font-bold font-mono px-3 py-1 rounded-xl leading-none shrink-0 ${cls.number}`}>
            #{order.id}
          </span>
          <DeliveryLabel data={order.deliveryDate} />
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      <p className={`font-semibold leading-snug ${dimmed ? 'text-gray-500' : 'text-gray-900'}`}>
        {primary ?? order.buyerName}
      </p>

      {order.source === 'loja_integrada' && (
        <div className="flex items-center gap-1 mt-0.5">
          <Image src="/lojaintegrada-icon.svg" alt="Loja Integrada" width={11} height={11} className="rounded-sm opacity-50" />
          <span className="text-xs text-gray-300 font-mono">#{order.olistNumero ?? order.id}</span>
        </div>
      )}

      {secondary && (
        <p className="text-sm text-gray-500 mt-0.5">{secondary}</p>
      )}

      {tag && (
        <span className="inline-block mt-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg px-2 py-0.5">
          {tag}
        </span>
      )}

      <div className="flex justify-end mt-2">
        <span className={`text-xs font-semibold ${cls.cta}`}>{cta}</span>
      </div>
    </button>
  )
}
