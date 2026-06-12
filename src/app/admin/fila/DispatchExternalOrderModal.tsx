'use client'

import { useState, useEffect } from 'react'
import { ActionModal } from '@/components/order/OrderDrawer/ActionModal'
import { EXTERNAL_PLATFORM_LABELS } from '@/constants/orderDisplay'
import type { ExternalDispatchOrderDTO } from '@/domains/orders/external-order.types'

interface UserOption {
  id: string
  displayName: string
}

interface Props {
  order: ExternalDispatchOrderDTO
  onClose: () => void
  onDispatched: () => void
}

export function DispatchExternalOrderModal({ order, onClose, onDispatched }: Props) {
  const [courierId, setCourierId] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/users/couriers')
      .then((r) => r.json())
      .then((data) => setUsers(data.couriers as UserOption[]))
      .catch(() => {})
      .finally(() => setUsersLoading(false))
  }, [])

  async function submit() {
    if (!courierId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders/external/${order.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Erro ao despachar')
        return
      }
      onDispatched()
      onClose()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionModal title={`Despachar #${order.externalNumber} — ${EXTERNAL_PLATFORM_LABELS[order.platform]}`} onClose={onClose}>
      <div className="space-y-2">
        <select
          value={courierId}
          onChange={(e) => setCourierId(e.target.value)}
          disabled={usersLoading}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
        >
          <option value="">{usersLoading ? 'Carregando...' : 'Selecionar motoboy...'}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          onClick={submit}
          disabled={loading || !courierId}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? 'Despachando...' : '🏍 Marcar como Despachado'}
        </button>
      </div>
    </ActionModal>
  )
}
