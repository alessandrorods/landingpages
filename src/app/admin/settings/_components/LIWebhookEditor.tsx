'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const DEFAULT_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? '') + '/api/webhooks/loja-integrada'

export function LIWebhookEditor() {
  const [registered, setRegistered] = useState(false)
  const [registeredUrl, setRegisteredUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [secret, setSecret] = useState('')
  const [notifyUrl, setNotifyUrl] = useState(DEFAULT_URL)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/config/loja-integrada-webhook')
      .then((r) => r.json())
      .then((d) => {
        setRegistered(!!d.registered)
        setRegisteredUrl(d.notifyUrl ?? null)
        if (d.notifyUrl) setNotifyUrl(d.notifyUrl)
      })
      .catch(() => setError('Não foi possível carregar o status do webhook'))
      .finally(() => setLoading(false))
  }, [])

  async function register() {
    if (!secret.trim() || !notifyUrl.trim()) {
      setError('Preencha a senha e a URL')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/config/loja-integrada-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim(), notifyUrl: notifyUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao registrar'); return }
      setRegistered(true)
      setRegisteredUrl(notifyUrl.trim())
      setSecret('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Webhook · Loja Integrada</p>
            <p className="text-xs text-gray-400 mt-0.5">Recebe pedidos aprovados automaticamente</p>
          </div>
        </div>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Registrado</span>}
      </div>

      {/* Status atual */}
      {!loading && (
        <div className="flex items-center gap-2 text-xs">
          {registered && registeredUrl ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-gray-500 truncate font-mono">{registeredUrl}</span>
            </>
          ) : (
            <span className="text-gray-400">Webhook não cadastrado</span>
          )}
        </div>
      )}

      {loading && (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Formulário de (re)cadastro */}
      <div className="space-y-2 pt-1">
        <div>
          <label className="block text-xs text-gray-400 mb-1">URL de notificação</label>
          <input
            type="url"
            value={notifyUrl}
            onChange={(e) => setNotifyUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://seu-dominio.com/api/webhooks/loja-integrada"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Senha do webhook{' '}
            {registered && <span className="text-green-600">(já configurada — preencha para alterar)</span>}
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={registered ? '••••••••' : 'Defina uma senha secreta'}
          />
        </div>

        <button
          type="button"
          onClick={register}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Registrando…' : registered ? 'Atualizar webhook' : 'Registrar webhook'}
        </button>
      </div>
    </div>
  )
}
