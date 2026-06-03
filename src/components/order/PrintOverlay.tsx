'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { OrderPrintContent } from './OrderPrintContent'
import type { OrderDTO } from '@/domains/orders/order.types'

export function PrintOverlay({ order, onClose }: { order: OrderDTO; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 150)
    window.addEventListener('afterprint', onClose, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', onClose)
    }
  }, [onClose])

  return createPortal(
    <div data-print-overlay="" className="hidden print:block">
      <OrderPrintContent order={order} />
    </div>,
    document.body,
  )
}
