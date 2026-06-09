'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { OrderDTO } from '@/domains/orders/order.types'

const POLL_INTERVAL = 60_000

export function useOrders(status: string, options?: { courierId?: string; todayOnly?: boolean }) {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetch_ = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const params = new URLSearchParams({ status })
      if (options?.courierId) params.set('courierId', options.courierId)
      if (options?.todayOnly) params.set('todayOnly', 'true')
      const res = await fetch(`/api/admin/orders?${params}`, { signal: controller.signal })
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setOrders(data.orders ?? [])
      setLastUpdate(new Date())
      setError('')
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setError('Não foi possível carregar os pedidos')
    } finally {
      setLoading(false)
    }
  }, [status, options?.courierId, options?.todayOnly])

  const fetchRef = useRef(fetch_)
  useEffect(() => { fetchRef.current = fetch_ }, [fetch_])

  useEffect(() => {
    let cancelled = false

    async function run() {
      await fetchRef.current()
      if (!cancelled) {
        setNextRefreshAt(Date.now() + POLL_INTERVAL)
        timerRef.current = setTimeout(run, POLL_INTERVAL)
      }
    }

    run()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [])

  return { orders, loading, error, lastUpdate, nextRefreshAt, refresh: fetch_ }
}
