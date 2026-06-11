'use client'

import { useState } from 'react'
import { ActionModal } from '@/components/order/OrderDrawer/ActionModal'
import { useDeliveryRegions } from '@/hooks/useDeliveryRegions'
import { resolveRegion } from '@/domains/orders/dispatch-queue'

function maskCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

function CepLookupModal({ onClose }: { onClose: () => void }) {
  const { regions, loading } = useDeliveryRegions()
  const [cep, setCep] = useState('')

  const digits = cep.replace(/\D/g, '')
  const result = digits.length === 8 ? resolveRegion(digits, regions) : null
  const found = result && result.region !== 'unknown'

  return (
    <ActionModal title="Consultar CEP" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">CEP</label>
          <input
            type="text"
            inputMode="numeric"
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
            placeholder="00000-000"
            maxLength={9}
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>

        {loading && digits.length === 8 && (
          <p className="text-sm text-gray-500">Carregando regiões...</p>
        )}

        {!loading && result && (
          found ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-green-700">Região de atendimento</p>
              <p className="text-lg font-bold text-green-800">{result.regionLabel}</p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-red-700">CEP fora das regiões de atendimento cadastradas</p>
            </div>
          )
        )}
      </div>
    </ActionModal>
  )
}

export function CepLookupButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 rounded-xl px-3 py-2 transition-colors bg-purple-50 hover:bg-purple-100"
      >
        Consultar CEP
      </button>
      {open && <CepLookupModal onClose={() => setOpen(false)} />}
    </>
  )
}
