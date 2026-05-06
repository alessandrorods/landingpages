'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/lib/admin/auth'

const AREAS: { role: Role; label: string; icon: string }[] = [
  { role: 'vendas', label: 'Vendas', icon: '💰' },
  { role: 'florista', label: 'Florista', icon: '🌸' },
  { role: 'expedicao', label: 'Expedição', icon: '🚚' },
  { role: 'motoboy', label: 'Motoboy', icon: '🏍️' },
  { role: 'admin', label: 'Administrador', icon: '🔑' },
]

const REDIRECT: Record<Role, string> = {
  vendas: '/admin/vendas',
  florista: '/admin/florista',
  expedicao: '/admin/expedicao',
  motoboy: '/admin/motoboy',
  admin: '/admin',
}

export const LS_KEY = '_dq_session'

export type StoredSession = { token: string; role: Role; expiresAt: number }

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('vendas')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    async function tryRestore() {
      try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return
        const session: StoredSession = JSON.parse(raw)
        if (!session.token || !session.role || session.expiresAt < Date.now()) {
          localStorage.removeItem(LS_KEY)
          return
        }
        const res = await fetch('/api/admin/auth/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: session.token }),
        })
        if (res.ok) {
          // Refresh expiry on each restore so active users stay logged in
          const updated: StoredSession = { ...session, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }
          localStorage.setItem(LS_KEY, JSON.stringify(updated))
          router.replace(REDIRECT[session.role])
        } else {
          localStorage.removeItem(LS_KEY)
        }
      } catch {
        // ignore — show login form normally
      } finally {
        setRestoring(false)
      }
    }
    tryRestore()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao entrar')
        return
      }
      if (data.token) {
        const session: StoredSession = {
          token: data.token,
          role,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        }
        localStorage.setItem(LS_KEY, JSON.stringify(session))
      }
      router.push(REDIRECT[role])
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (restoring) {
    return (
      <div className="min-h-screen bg-gray-50 [color-scheme:light] flex flex-col items-center justify-center px-4">
        <p className="text-2xl">🌿</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 [color-scheme:light] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl mb-2">🌿</p>
          <h1 className="text-2xl font-bold text-gray-900">Mundo Planta</h1>
          <p className="text-sm text-gray-500 mt-1">Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Área</label>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map((a) => (
                <button
                  key={a.role}
                  type="button"
                  onClick={() => setRole(a.role)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    role === a.role
                      ? 'bg-green-50 border-green-500 text-green-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              autoComplete="current-password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-base transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
