'use client'

import { useState, useEffect } from 'react'
import type { Role } from '@/domains/admin/auth'

export const LS_KEY = '_dq_session'
export type StoredSession = { token: string; role: Role; expiresAt: number }

const REDIRECT: Record<Role, string> = {
  vendas: '/admin/vendas',
  florista: '/admin/florista',
  expedicao: '/admin/painel',
  motoboy: '/admin/motoboy',
  admin: '/admin',
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
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
          const updated: StoredSession = { ...session, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }
          localStorage.setItem(LS_KEY, JSON.stringify(updated))
          window.location.href = REDIRECT[session.role]
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
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao entrar')
        return
      }
      const role = data.role as Role
      if (data.token) {
        const session: StoredSession = {
          token: data.token,
          role,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        }
        localStorage.setItem(LS_KEY, JSON.stringify(session))
      }
      window.location.href = REDIRECT[role]
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (restoring) {
    return (
      <div className="admin-root min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <p className="text-2xl">🌿</p>
      </div>
    )
  }

  return (
    <div className="admin-root min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl mb-2">🌿</p>
          <h1 className="text-2xl font-bold text-gray-900">Mundo Planta</h1>
          <p className="text-sm text-gray-500 mt-1">Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de usuário"
              autoComplete="username"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
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
