'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { OrderPrintContent } from '@/components/OrderPrintContent'
import type { OrderDTO } from '@/domains/orders/order.types'

export default function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (data.order) setOrder(data.order); else setError(true) })
      .catch(() => setError(true))
  }, [id])

  useEffect(() => {
    if (!order) return
    const retrier = setInterval(() => {
      if (document.readyState === 'complete') {
        window.print()
        clearInterval(retrier)
      }
    }, 1000)
    return () => clearInterval(retrier)
  }, [order])

  if (error) return <div className="text-red-700">Erro ao carregar o pedido</div>
  if (!order) return null

  return <OrderPrintContent order={order} />
}
