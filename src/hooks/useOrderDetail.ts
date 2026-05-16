'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OrderDTO } from '@/domains/orders/order.types'

export function useOrderDetail(id: number) {
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrder(data.order ?? null)
    } catch {
      setError('Não foi possível carregar o pedido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { refresh() }, [refresh])

  return { order, loading, error, refresh }
}
