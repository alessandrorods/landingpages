'use client'

import { useState, useEffect } from 'react'
import type { DeliveryRegion, ZipRange } from '@/domains/config/config.types'

function cleanZip(v: string): string {
  return v.replace(/\D/g, '').slice(0, 8)
}

function formatZip(v: string): string {
  const d = cleanZip(v)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

const EMPTY_REGION: DeliveryRegion = {
  region: '',
  label: '',
  zipRanges: [{ zipStart: '', zipEnd: '' }],
}

export function RegioesEditor() {
  const [regions, setRegions] = useState<DeliveryRegion[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<DeliveryRegion>(EMPTY_REGION)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((d) => setRegions((d.config?.deliveryRegions as DeliveryRegion[]) ?? []))
      .catch(() => setError('Não foi possível carregar as regiões'))
  }, [])

  async function save(next: DeliveryRegion[]) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'deliveryRegions', value: next }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      setRegions(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  function commitEdit() {
    if (editing === null) return
    save(regions.map((r, i) => (i === editing ? draft : r)))
    setEditing(null)
  }

  function commitAdd() {
    save([...regions, draft])
    setAdding(false)
    setDraft(EMPTY_REGION)
  }

  function startEdit(idx: number) {
    setAdding(false)
    setEditing(idx)
    setDraft(regions[idx])
  }

  function startAdd() {
    setEditing(null)
    setDraft(EMPTY_REGION)
    setAdding(true)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Regiões de entrega</p>
          <p className="text-xs text-gray-400 mt-0.5">Faixas de CEP → região (usado na fila de despacho)</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Salvo</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {regions.map((r, idx) => (
          <div key={idx} className="border border-gray-100 rounded-xl p-3">
            {editing === idx ? (
              <RegionForm value={draft} onChange={setDraft} onConfirm={commitEdit} onCancel={() => setEditing(null)} saving={saving} />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {r.zipRanges.map(z => `${formatZip(z.zipStart)} – ${formatZip(z.zipEnd)}`).join(' · ')}
                    <span className="font-sans ml-1">· {r.region}</span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => startEdit(idx)} className="text-xs text-blue-600 hover:underline">editar</button>
                  <button type="button" onClick={() => save(regions.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:underline">remover</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-3">
          <RegionForm value={draft} onChange={setDraft} onConfirm={commitAdd} onCancel={() => setAdding(false)} saving={saving} />
        </div>
      ) : (
        <button type="button" onClick={startAdd}
          className="w-full border border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
          + Adicionar região
        </button>
      )}
    </div>
  )
}

function RegionForm({ value, onChange, onConfirm, onCancel, saving }: {
  value: DeliveryRegion
  onChange: (v: DeliveryRegion) => void
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}) {
  function updateRange(idx: number, field: keyof ZipRange, raw: string) {
    const updated = value.zipRanges.map((z, i) =>
      i === idx ? { ...z, [field]: cleanZip(raw) } : z
    )
    onChange({ ...value, zipRanges: updated })
  }

  function addRange() {
    onChange({ ...value, zipRanges: [...value.zipRanges, { zipStart: '', zipEnd: '' }] })
  }

  function removeRange(idx: number) {
    onChange({ ...value, zipRanges: value.zipRanges.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Slug da região" value={value.region} onChange={e => onChange({ ...value, region: e.target.value })} placeholder="ex: mogi-leste" />
        <Field label="Label"          value={value.label}  onChange={e => onChange({ ...value, label: e.target.value })}  placeholder="ex: Mogi Leste" />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-gray-400">Faixas de CEP</p>
        {value.zipRanges.map((z, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <div className="flex-1">
              <Field label="" value={formatZip(z.zipStart)} onChange={e => updateRange(idx, 'zipStart', e.target.value)} placeholder="08710-000" />
            </div>
            <span className="text-xs text-gray-400 shrink-0">–</span>
            <div className="flex-1">
              <Field label="" value={formatZip(z.zipEnd)} onChange={e => updateRange(idx, 'zipEnd', e.target.value)} placeholder="08710-999" />
            </div>
            {value.zipRanges.length > 1 && (
              <button type="button" onClick={() => removeRange(idx)} className="text-xs text-red-400 hover:text-red-600 shrink-0 px-1">×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addRange} className="text-xs text-blue-500 hover:text-blue-700">
          + Faixa
        </button>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancelar</button>
        <button type="button" onClick={onConfirm} disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
          {saving ? '...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, className = '' }: {
  label: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; className?: string
}) {
  return (
    <div className={className}>
      {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
      <input type="text" value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  )
}
