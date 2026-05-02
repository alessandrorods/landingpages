'use client'

import { useState, useEffect } from 'react'

interface Props {
  count: number
  lastUpdate: Date | null
  nextRefreshAt: number | null
  onRefresh: () => void
  loading: boolean
}

export default function StatusBar({ count, lastUpdate, nextRefreshAt, onRefresh, loading }: Props) {
  const [secs, setSecs] = useState<number | null>(null)

  useEffect(() => {
    if (!nextRefreshAt || loading) {
      setSecs(null)
      return
    }
    function tick() {
      setSecs(Math.max(0, Math.ceil((nextRefreshAt! - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [nextRefreshAt, loading])

  const time = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-800">{count}</span>{' '}
        {count === 1 ? 'pedido' : 'pedidos'}
        {time && <span className="ml-1 text-gray-400">· {time}</span>}
      </p>
      <div className="flex items-center gap-2">
        {secs !== null && (
          <span className="text-xs text-gray-400 tabular-nums">{secs}s</span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-sm text-green-700 font-medium disabled:opacity-40"
        >
          {loading ? '...' : '↻ Atualizar'}
        </button>
      </div>
    </div>
  )
}
