'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { OlistOrderSummary } from '@/clients/olist/types'

const POLL_INTERVAL = 60_000

export function useOrdersSummary(situacao: string, dataAtualizacao?: string) {
  const [resumos, setResumos] = useState<OlistOrderSummary[]>([])
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
      const params = new URLSearchParams({ situacao, summary: 'true' })
      if (dataAtualizacao) params.set('dataAtualizacao', dataAtualizacao)
      const res = await fetch(`/api/admin/orders?${params}`, { signal: controller.signal })
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      const toSortKey = (d: string | undefined) => {
        if (!d) return ''
        const [dd, mm, yyyy] = d.split('/')
        return `${yyyy}${mm}${dd}`
      }
      const sorted = (data.resumos ?? [] as OlistOrderSummary[]).slice().sort(
        (a: OlistOrderSummary, b: OlistOrderSummary) =>
          toSortKey(a.data_prevista).localeCompare(toSortKey(b.data_prevista)),
      )
      setResumos(sorted)
      setLastUpdate(new Date())
      setError('')
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return
      setError('Não foi possível carregar os pedidos')
    } finally {
      setLoading(false)
    }
  }, [situacao, dataAtualizacao])

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

  return { resumos, loading, error, lastUpdate, nextRefreshAt, refresh: fetch_ }
}
