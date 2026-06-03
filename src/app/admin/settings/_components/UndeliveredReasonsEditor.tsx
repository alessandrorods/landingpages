'use client'

import { useState, useEffect } from 'react'

export function UndeliveredReasonsEditor() {
  const [reasons, setReasons] = useState<string[]>([])
  const [newReason, setNewReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((d) => setReasons((d.config?.undeliveredReasons as string[]) ?? []))
      .catch(() => setError('Não foi possível carregar os motivos'))
  }, [])

  async function save(next: string[]) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'undeliveredReasons', value: next }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      setReasons(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  function add() {
    const trimmed = newReason.trim()
    if (!trimmed || reasons.includes(trimmed)) return
    save([...reasons, trimmed])
    setNewReason('')
  }

  function remove(idx: number) {
    save(reasons.filter((_, i) => i !== idx))
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...reasons]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    save(next)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Motivos de não entrega</p>
          <p className="text-xs text-gray-400 mt-0.5">Exibidos ao motoboy ao registrar uma ocorrência</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Salvo</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-1.5">
        {reasons.map((r, idx) => (
          <div key={idx} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2">
            <span className="flex-1 text-sm text-gray-800">{r}</span>
            <div className="flex gap-1 shrink-0">
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0 || saving}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1">↑</button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === reasons.length - 1 || saving}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1">↓</button>
              <button type="button" onClick={() => remove(idx)} disabled={saving}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-1">remover</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Novo motivo..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={add}
          disabled={saving || !newReason.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}
