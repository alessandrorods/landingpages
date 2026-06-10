'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { OrderPrintContent } from './OrderPrintContent'
import type { OrderDTO } from '@/domains/orders/order.types'
import type { DeliveryRegion } from '@/domains/orders/dispatch-queue'
import type { PeriodoEntrega } from '@/constants/pedido.types'

interface Props {
  order: OrderDTO
  regions: DeliveryRegion[]
  periods: PeriodoEntrega[]
  loading: boolean
  onClose: () => void
}

export function PrintOverlay({ order, regions, periods, loading, onClose }: Props) {
  useEffect(() => {
    window.addEventListener('afterprint', onClose, { once: true })
    return () => window.removeEventListener('afterprint', onClose)
  }, [onClose])

  return createPortal(
    <div data-print-overlay="" className="hidden print:block">
      <OrderPrintContent order={order} data={{ regions, periods, loading }} onReady={() => window.print()} />
    </div>,
    document.body,
  )
}
