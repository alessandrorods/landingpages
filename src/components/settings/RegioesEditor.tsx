'use client'

import { useState, useEffect } from 'react'
import type { DeliveryRegion } from '@/domains/config/config.types'

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
  zipStart: '',
  zipEnd: '',
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
          <p className="text-xs text-gray-400 mt-0.5">Faixa de CEP → região (usado na fila de despacho)</p>
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
                    {formatZip(r.zipStart)} – {formatZip(r.zipEnd)}
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
  const field = (k: keyof DeliveryRegion) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const v = (k === 'zipStart' || k === 'zipEnd') ? cleanZip(raw) : raw
    onChange({ ...value, [k]: v })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="CEP início" value={formatZip(value.zipStart)} onChange={field('zipStart')} placeholder="08790-000" />
        <Field label="CEP fim"   value={formatZip(value.zipEnd)}   onChange={field('zipEnd')}   placeholder="08810-999" />
        <Field label="Slug da região" value={value.region} onChange={field('region')} placeholder="ex: mogi-leste" />
        <Field label="Label"          value={value.label}  onChange={field('label')}  placeholder="ex: Mogi Leste" />
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
