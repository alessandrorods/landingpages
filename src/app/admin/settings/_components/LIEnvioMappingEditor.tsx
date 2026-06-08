'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { LIFormaEnvio } from '@/clients/loja-integrada/types'

interface DeliveryPeriod {
  id: string
  label: string
}

export function LIEnvioMappingEditor() {
  const [formasEnvio, setFormasEnvio] = useState<LIFormaEnvio[]>([])
  const [periods, setPeriods] = useState<DeliveryPeriod[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/config/li-envio-mapping').then((r) => r.json()),
      fetch('/api/admin/config').then((r) => r.json()),
    ])
      .then(([liData, configData]) => {
        setFormasEnvio(liData.formasEnvio ?? [])
        setMapping(liData.mapping ?? {})
        setPeriods((configData.config?.deliveryPeriods as DeliveryPeriod[]) ?? [])
      })
      .catch(() => setError('Não foi possível carregar os dados'))
      .finally(() => setLoading(false))
  }, [])

  function setEnvioMapping(liEnvioId: string, periodId: string) {
    setMapping((prev) => {
      const next = { ...prev }
      if (periodId === '') {
        delete next[liEnvioId]
      } else {
        next[liEnvioId] = periodId
      }
      return next
    })
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/config/li-envio-mapping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      setMapping(data.mapping)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/lojaintegrada-icon.svg" alt="Loja Integrada" width={16} height={16} className="rounded-sm" />
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Formas de envio · Loja Integrada</p>
            <p className="text-xs text-gray-400 mt-0.5">Mapeie cada forma de envio da LI para um horário de entrega</p>
          </div>
        </div>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Salvo</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      )}

      {!loading && formasEnvio.length === 0 && !error && (
        <p className="text-sm text-gray-400 text-center py-2">Nenhuma forma de envio ativa encontrada na LI</p>
      )}

      {!loading && formasEnvio.length > 0 && (
        <div className="space-y-2">
          {formasEnvio.map((envio) => (
            <div key={envio.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium truncate">{envio.nome}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{envio.codigo}</p>
              </div>
              <select
                value={mapping[String(envio.id)] ?? ''}
                onChange={(e) => setEnvioMapping(String(envio.id), e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shrink-0"
              >
                <option value="">— sem mapeamento —</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Salvando…' : 'Salvar mapeamento'}
        </button>
      )}
    </div>
  )
}
