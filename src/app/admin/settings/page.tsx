'use client'

import { useState, useEffect } from 'react'
import { CONFIG_LABELS } from '@/domains/config/config.types'
import type { ConfigKey } from '@/domains/config/config.types'
import { PeriodosEditor } from '@/components/settings/PeriodosEditor'
import { RegioesEditor } from '@/components/settings/RegioesEditor'

type ConfigMap = Partial<Record<ConfigKey, unknown>>

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigMap | null>(null)
  const [saving, setSaving] = useState<ConfigKey | null>(null)
  const [saved, setSaved] = useState<ConfigKey | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((d) => setConfig(d.config))
      .catch(() => setError('Não foi possível carregar as configurações'))
  }, [])

  async function save(key: ConfigKey, value: unknown) {
    setSaving(key)
    setError('')
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      setConfig((prev) => prev ? { ...prev, [key]: data.value } : prev)
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Configurações</h1>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4 mb-4">{error}</p>}

      {!config && !error && (
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-16" />
      )}

      {config && (
        <div className="space-y-4">
          {(Object.keys(CONFIG_LABELS) as ConfigKey[]).map((key) => (
            <ConfigField
              key={key}
              label={CONFIG_LABELS[key] ?? key}
              value={config[key] as number}
              saving={saving === key}
              saved={saved === key}
              onSave={(value) => save(key, value)}
            />
          ))}
        </div>
      )}

      <PeriodosEditor />
      <RegioesEditor />
    </div>
  )
}

function ConfigField({
  label,
  value,
  saving,
  saved,
  onSave,
}: {
  label: string
  value: number
  saving: boolean
  saved: boolean
  onSave: (value: number) => void
}) {
  const [input, setInput] = useState(String(value))

  useEffect(() => { setInput(String(value)) }, [value])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(input, 10)
    if (isNaN(n) || n < 0) return
    onSave(n)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {label}
      </label>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="number"
          min={0}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          {saved ? '✓ Salvo' : saving ? '...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
