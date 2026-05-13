'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { OlistOrderDetails } from '@/clients/olist/types'

const POLL_INTERVAL = 60_000

export function useOrders(situacao: string) {
  const [pedidos, setPedidos] = useState<OlistOrderDetails[]>([])
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
      const res = await fetch(`/api/admin/orders?situacao=${situacao}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      const toSortKey = (d: string | undefined) => {
        if (!d) return ''
        const [dd, mm, yyyy] = d.split('/')
        return `${yyyy}${mm}${dd}`
      }
      const sorted = (data.pedidos ?? [] as OlistOrderDetails[]).slice().sort(
        (a: OlistOrderDetails, b: OlistOrderDetails) =>
          toSortKey(a.data_prevista).localeCompare(toSortKey(b.data_prevista)),
      )
      setPedidos(sorted)
      setLastUpdate(new Date())
      setError('')
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setError('Não foi possível carregar os pedidos')
    } finally {
      setLoading(false)
    }
  }, [situacao])

  // Ref para ter sempre a versão mais recente de fetch_ sem recriar o efeito
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
  }, []) // roda uma única vez por montagem

  return { pedidos, loading, error, lastUpdate, nextRefreshAt, refresh: fetch_ }
}
