'use client'

import { useState } from 'react'
import { ActionModal } from '@/components/order/OrderDrawer/ActionModal'
import { useDeliveryPeriods } from '@/hooks/useDeliveryPeriods'
import { useDeliveryRegions } from '@/hooks/useDeliveryRegions'
import { resolveRegion } from '@/domains/orders/dispatch-queue'
import { EXTERNAL_PLATFORMS } from '@/domains/orders/external-order.types'
import { EXTERNAL_PLATFORM_LABELS } from '@/constants/orderDisplay'
import type { ExternalPlatform } from '@/domains/orders/external-order.types'

function maskCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

function todayInputDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function nowInputTime(): string {
  return new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false })
}

function fromInputDate(yyyymmdd: string): string {
  const [yyyy, mm, dd] = yyyymmdd.split('-')
  return `${dd}/${mm}/${yyyy}`
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function AddExternalOrderModal({ onClose, onCreated }: Props) {
  const { periods } = useDeliveryPeriods()
  const { regions } = useDeliveryRegions()

  const [platform, setPlatform] = useState<ExternalPlatform>('ifood')
  const [externalNumber, setExternalNumber] = useState('')
  const [cep, setCep] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [date, setDate] = useState(todayInputDate())
  const [period, setPeriod] = useState('')
  const [time, setTime] = useState(nowInputTime())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cepDigits = cep.replace(/\D/g, '')
  const regionPreview = cepDigits.length === 8 ? resolveRegion(cepDigits, regions) : null

  async function submit() {
    if (!externalNumber.trim()) { setError('Informe o número do pedido'); return }
    if (!date) { setError('Informe o dia'); return }
    if (!time) { setError('Informe o horário'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          externalNumber: externalNumber.trim(),
          zipCode: cepDigits || undefined,
          neighborhood: neighborhood.trim() || undefined,
          deliveryDate: fromInputDate(date),
          deliveryPeriod: period || undefined,
          scheduledTime: time,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Erro ao cadastrar pedido')
        return
      }
      onCreated()
      onClose()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionModal title="Pedido Externo" onClose={onClose} size="md">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Plataforma</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as ExternalPlatform)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
          >
            {EXTERNAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>{EXTERNAL_PLATFORM_LABELS[p]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Número do pedido</label>
          <input
            type="text"
            value={externalNumber}
            onChange={(e) => setExternalNumber(e.target.value)}
            placeholder="Ex: 4521"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">CEP</label>
            <input
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => setCep(maskCep(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Bairro</label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Opcional"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
        </div>

        {regionPreview && (
          regionPreview.region !== 'unknown' ? (
            <p className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              Região: {regionPreview.regionLabel}
            </p>
          ) : (
            <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              CEP fora das regiões cadastradas
            </p>
          )
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Dia</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Horário</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
        </div>

        {periods.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
            >
              <option value="">Sem período</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
        >
          {loading ? 'Cadastrando...' : 'Adicionar à fila'}
        </button>
      </div>
    </ActionModal>
  )
}
