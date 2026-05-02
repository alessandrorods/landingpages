'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TinyPedidoCompleto } from '@/lib/olist/types'

export function useOrders(situacao: string) {
  const [pedidos, setPedidos] = useState<TinyPedidoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?situacao=${situacao}`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setPedidos(data.pedidos ?? [])
      setLastUpdate(new Date())
      setError('')
    } catch {
      setError('Não foi possível carregar os pedidos')
    } finally {
      setLoading(false)
    }
  }, [situacao])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 60_000)
    return () => clearInterval(interval)
  }, [fetch_])

  return { pedidos, loading, error, lastUpdate, refresh: fetch_ }
}
