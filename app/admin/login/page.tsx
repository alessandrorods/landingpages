'use client'

import { useState } from 'react'
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

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('vendas')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao entrar')
        return
      }
      router.push(REDIRECT[role])
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
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
