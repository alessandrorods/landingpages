'use client'

import { useState, useEffect } from 'react'
import { useDrawerAction } from './useDrawerAction'
import type { OrderDTO } from '@/domains/orders/order.types'

interface UserOption {
  id: string
  displayName: string
}

interface Props {
  order: OrderDTO
  close: () => void
}

export function DrawerActionDispatch({ order, close }: Props) {
  const { loading, err, run } = useDrawerAction()
  const [courierId, setCourierId] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users/couriers')
      .then((r) => r.json())
      .then((data) => {
        const motoboys = data.couriers as UserOption[]
        setUsers(motoboys)
        // pré-seleciona o motoboy atual se já tiver um
        if (order.courierName) {
          const match = motoboys.find((u) => u.displayName === order.courierName)
          if (match) setCourierId(match.id)
        }
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false))
  }, [order.courierName])

  async function dispatch() {
    await run(async () => {
      const res = await fetch(`/api/admin/orders/${order.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao despachar')
      close()
    })
  }

  return (
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
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button
        onClick={dispatch}
        disabled={loading || !courierId}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Despachando...' : '🏍 Marcar como Enviado'}
      </button>
    </div>
  )
}
