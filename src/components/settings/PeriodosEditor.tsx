'use client'

import { useState, useEffect } from 'react'
import type { PeriodoEntrega } from '@/constants/pedido.types'

interface OlistMethod {
  id: string
  descricao: string
}

const EMPTY_PERIOD: PeriodoEntrega = {
  id: '',
  label: '',
  olistFormaFrete: '',
  olistFormaFreteId: '',
  sortOrder: 0,
  deliveryLimitHour: '19:00',
}

export function PeriodosEditor() {
  const [periods, setPeriods] = useState<PeriodoEntrega[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState<PeriodoEntrega>(EMPTY_PERIOD)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [olistMethods, setOlistMethods] = useState<OlistMethod[]>([])

  useEffect(() => {
    fetch('/api/periods')
      .then((r) => r.json())
      .then((d: { periods: PeriodoEntrega[] }) => setPeriods(d.periods))
      .catch(() => setError('Não foi possível carregar os períodos'))

    fetch('/api/admin/olist/shipping-methods')
      .then((r) => r.json())
      .then((d: { methods: OlistMethod[] }) => setOlistMethods(d.methods ?? []))
      .catch(() => {/* silently ignore — select will show manual input */})
  }, [])

  async function save(next: PeriodoEntrega[]) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'deliveryPeriods', value: next }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      setPeriods(next)
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
    const next = periods.map((p, i) => (i === editing ? draft : p))
    setEditing(null)
    save(next)
  }

  function commitAdd() {
    const next = [...periods, draft]
    setAdding(false)
    setDraft(EMPTY_PERIOD)
    save(next)
  }

  function remove(idx: number) {
    save(periods.filter((_, i) => i !== idx))
  }

  function startEdit(idx: number) {
    setAdding(false)
    setEditing(idx)
    setDraft(periods[idx])
  }

  function startAdd() {
    setEditing(null)
    setDraft(EMPTY_PERIOD)
    setAdding(true)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Períodos de entrega</p>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Salvo</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        {periods.map((p, idx) => (
          <div key={p.id} className="border border-gray-100 rounded-xl p-3">
            {editing === idx ? (
              <PeriodForm
                value={draft}
                onChange={setDraft}
                onConfirm={commitEdit}
                onCancel={() => setEditing(null)}
                saving={saving}
                olistMethods={olistMethods}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-mono">{p.id}</span>
                    {' · '}entrega até {p.deliveryLimitHour}
                    {' · '}ordem {p.sortOrder}
                  </p>
                  {p.olistFormaFrete && (
                    <p className="text-xs text-gray-400 mt-0.5">Olist: {p.olistFormaFrete}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => startEdit(idx)} className="text-xs text-blue-600 hover:underline">
                    editar
                  </button>
                  <button type="button" onClick={() => remove(idx)} className="text-xs text-red-500 hover:underline">
                    remover
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-3">
          <PeriodForm
            value={draft}
            onChange={setDraft}
            onConfirm={commitAdd}
            onCancel={() => setAdding(false)}
            saving={saving}
            olistMethods={olistMethods}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          className="w-full border border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
        >
          + Adicionar período
        </button>
      )}
    </div>
  )
}

function PeriodForm({
  value,
  onChange,
  onConfirm,
  onCancel,
  saving,
  olistMethods,
}: {
  value: PeriodoEntrega
  onChange: (v: PeriodoEntrega) => void
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
  olistMethods: OlistMethod[]
}) {
  const field = (k: keyof PeriodoEntrega) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: k === 'sortOrder' ? Number(e.target.value) : e.target.value })

  function selectOlistMethod(id: string) {
    const method = olistMethods.find((m) => m.id === id)
    if (!method) return
    onChange({ ...value, olistFormaFreteId: method.id, olistFormaFrete: method.descricao })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="ID" value={value.id} onChange={field('id')} placeholder="ex: manha" />
        <Field label="Ordem" value={String(value.sortOrder)} onChange={field('sortOrder')} type="number" />
        <Field label="Label" value={value.label} onChange={field('label')} placeholder="ex: Manhã (após 8h)" className="col-span-2" />

        <div className="col-span-2">
          <p className="text-xs text-gray-400 mb-1">Método de frete (Olist)</p>
          {olistMethods.length > 0 ? (
            <select
              value={value.olistFormaFreteId}
              onChange={(e) => selectOlistMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— selecionar —</option>
              {olistMethods.map((m) => (
                <option key={m.id} value={m.id}>{m.descricao}</option>
              ))}
            </select>
          ) : (
            <Field label="" value={value.olistFormaFrete} onChange={field('olistFormaFrete')} placeholder="ex: Manhã I (depois das 08h)" />
          )}
        </div>

        <Field label="Entrega até" value={value.deliveryLimitHour} onChange={field('deliveryLimitHour')} placeholder="12:00" />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5">
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          {saving ? '...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}
