'use client'

import { useState, useEffect } from 'react'
import { useDrawerAction } from './useDrawerAction'
import { STATUS_BADGE } from '@/constants/orderDisplay'
import type { OrderDTO } from '@/domains/orders/order.types'
import type { OrderStatus } from '@/domains/orders/order.types'

interface UserOption {
  id: string
  displayName: string
}

const ALL_STATUSES: OrderStatus[] = [
  'pending', 'approved', 'preparing', 'ready',
  'available_for_pickup', 'dispatched', 'delivered', 'undelivered', 'cancelled',
]

interface Props {
  order: OrderDTO
  refresh: () => void
  defaultOpen?: boolean
}

export function DrawerActionForceStatus({ order, refresh, defaultOpen = false }: Props) {
  const { loading, err, run } = useDrawerAction()
  const [open, setOpen] = useState(defaultOpen)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [courierId, setCourierId] = useState('')
  const [receivedBy, setReceivedBy] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  const needsCourier = selectedStatus === 'dispatched' || selectedStatus === 'delivered'

  useEffect(() => {
    if (!needsCourier || users.length > 0) return
    setUsersLoading(true)
    fetch('/api/admin/users/couriers')
      .then((r) => r.json())
      .then((data) => {
        const couriers = data.couriers as UserOption[]
        setUsers(couriers)
        // pré-seleciona o motoboy atual se o pedido já tiver um
        if (order.courierName) {
          const match = couriers.find((u) => u.displayName === order.courierName)
          if (match) setCourierId(match.id)
        }
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false))
  }, [needsCourier, users.length, order.courierName])

  // quando seleciona delivered, pré-preenche receivedBy com o nome do destinatário
  useEffect(() => {
    if (selectedStatus === 'delivered' && !receivedBy) {
      setReceivedBy(order.recipientName ?? '')
    }
  }, [selectedStatus, order.recipientName, receivedBy])

  async function apply() {
    if (!selectedStatus) return
    await run(async () => {
      const body: Record<string, unknown> = { situacao: selectedStatus, force: true }
      if (needsCourier && courierId) body.courierId = courierId
      if (selectedStatus === 'delivered') body.receivedBy = receivedBy
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao alterar status')
      setOpen(false)
      setSelectedStatus('')
      setCourierId('')
      setReceivedBy('')
      refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-xs text-gray-400 hover:text-gray-600 font-medium py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-center"
      >
        Forçar alteração de status
      </button>
    )
  }

  const options = ALL_STATUSES.filter((s) => s !== order.status)

  return (
    <div className="space-y-2 pt-2 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Forçar status</p>

      <select
        value={selectedStatus}
        onChange={(e) => { setSelectedStatus(e.target.value as OrderStatus | ''); setCourierId('') }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
      >
        <option value="">Selecionar status...</option>
        {options.map((s) => (
          <option key={s} value={s}>{STATUS_BADGE[s].label}</option>
        ))}
      </select>

      {needsCourier && (
        <select
          value={courierId}
          onChange={(e) => setCourierId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
          disabled={usersLoading}
        >
          <option value="">{usersLoading ? 'Carregando...' : 'Motoboy (opcional)'}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
      )}

      {selectedStatus === 'delivered' && (
        <input
          type="text"
          value={receivedBy}
          onChange={(e) => setReceivedBy(e.target.value)}
          placeholder="Recebido por (opcional)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        />
      )}

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setSelectedStatus(''); setCourierId(''); setReceivedBy('') }}
          className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={apply}
          disabled={loading || !selectedStatus}
          className="flex-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading ? 'Aplicando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}
