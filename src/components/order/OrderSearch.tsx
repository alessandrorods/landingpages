'use client'

import { useState, useRef, useEffect } from 'react'
import { STATUS_BADGE } from '@/constants/orderDisplay'
import type { OrderDTO } from '@/domains/orders/order.types'
import OrderDrawer from './OrderDrawer'
import { OrderCard } from './OrderCard'

interface OrderSearchProps {
  variant?: 'bar' | 'modal'
  accentColor?: 'blue' | 'purple' | 'pink' | 'orange'
  compact?: boolean
}

const ACCENT = {
  blue:   { ring: 'focus:ring-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700',   link: 'text-blue-600' },
  purple: { ring: 'focus:ring-purple-400', btn: 'bg-purple-600 hover:bg-purple-700', link: 'text-purple-600' },
  pink:   { ring: 'focus:ring-pink-400',   btn: 'bg-pink-600 hover:bg-pink-700',   link: 'text-pink-600' },
  orange: { ring: 'focus:ring-orange-400', btn: 'bg-orange-500 hover:bg-orange-600', link: 'text-orange-600' },
}

function SearchForm({
  accentColor = 'blue',
  compact = false,
  onClose,
}: {
  accentColor?: OrderSearchProps['accentColor']
  compact?: boolean
  onClose?: () => void
}) {
  const colors = ACCENT[accentColor ?? 'blue']
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [err, setErr] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!compact) inputRef.current?.focus()
  }, [compact])

  // fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!compact || !order) return
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        clear()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [compact, order])

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    const n = numero.trim()
    if (!n) return
    setLoading(true)
    setErr('')
    setOrder(null)
    try {
      const res = await fetch(`/api/admin/orders/search?numero=${encodeURIComponent(n)}`)
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Pedido não encontrado'); return }
      setOrder(data.order)
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setOrder(null)
    setNumero('')
    setErr('')
    inputRef.current?.focus()
  }

  const result = order && (
    <>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Resultado</span>
        <button onClick={clear} className="text-xs text-gray-400 hover:text-gray-700 font-medium">
          Limpar ×
        </button>
      </div>
      <OrderCard
        order={order}
        onOpen={() => setDrawerOpen(true)}
        accent={accentColor}
        secondary={order.items[0]?.name ?? undefined}
        badge={
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_BADGE[order.status]?.label ?? order.status}
          </span>
        }
        cta="Abrir pedido →"
      />
    </>
  )

  return (
    <div ref={wrapperRef} className={compact ? 'relative' : undefined}>
      <form onSubmit={buscar} className="flex gap-2">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={numero}
          onChange={(e) => { setNumero(e.target.value); setErr(''); setOrder(null) }}
          placeholder="Nº do pedido"
          className={`flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent`}
          required
        />
        <button
          type="submit"
          disabled={loading || !numero.trim()}
          className={`${colors.btn} disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0`}
        >
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}

      {compact ? (
        order && (
          <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
            {result}
          </div>
        )
      ) : (
        order && <div className="mt-3">{result}</div>
      )}

      {drawerOpen && order && (
        <OrderDrawer
          id={order.id}
          onClose={() => {
            setDrawerOpen(false)
            onClose?.()
          }}
        />
      )}
    </div>
  )
}

export function OrderSearch({ variant = 'bar', accentColor = 'blue', compact = false }: OrderSearchProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (variant === 'bar') {
    if (compact) {
      return <SearchForm accentColor={accentColor} compact />
    }
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Rastrear pedido
        </p>
        <SearchForm accentColor={accentColor} />
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        aria-label="Buscar pedido"
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-20"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Rastrear pedido</p>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <SearchForm accentColor={accentColor} onClose={() => setModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
