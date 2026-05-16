'use client'

import { useState } from 'react'

interface Props {
  onCollected: () => void
}

export function CollectOrder({ onCollected }: Props) {
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const id = parseInt(orderId.trim(), 10)
    if (!id) return
    setLoading(true)
    setErr('')
    setDone(false)
    try {
      const res = await fetch('/api/admin/orders/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error ?? 'Erro ao coletar pedido')
        return
      }
      setDone(true)
      setOrderId('')
      onCollected()
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Coletar pedido</p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={orderId}
          onChange={(e) => { setOrderId(e.target.value); setErr(''); setDone(false) }}
          placeholder="Nº do pedido"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={loading || !orderId.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          {loading ? '...' : 'Coletar'}
        </button>
      </form>
      {done && <p className="text-sm text-green-700 font-medium mt-2">✓ Pedido marcado como saiu para entrega</p>}
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </div>
  )
}
