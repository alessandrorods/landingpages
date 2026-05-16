'use client'
import { useState, useEffect } from 'react'
import { ROLES, ROLE_LABELS } from '@/domains/admin/auth'
import type { Role } from '@/domains/admin/auth'
import type { UserDTO } from '../useUsers'

interface UserFormModalProps {
  user: UserDTO | null
  onSave: (data: { username: string; displayName: string; password: string; role: Role }) => Promise<void>
  onClose: () => void
}

export default function UserFormModal({ user, onSave, onClose }: UserFormModalProps) {
  const isEditing = user !== null
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(user?.role ?? 'vendas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDisplayName(user?.displayName ?? '')
    setUsername(user?.username ?? '')
    setRole(user?.role ?? 'vendas')
    setPassword('')
    setError('')
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = displayName.trim()
    const trimmedUser = username.trim()
    if (!trimmedName) { setError('Nome é obrigatório'); return }
    if (!trimmedUser) { setError('Username é obrigatório'); return }
    if (!isEditing && !password) { setError('Senha é obrigatória'); return }
    if (!isEditing && password.length < 4) { setError('Senha deve ter ao menos 4 caracteres'); return }

    setLoading(true)
    setError('')
    try {
      await onSave({ displayName: trimmedName, username: trimmedUser, password, role })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEditing ? 'Editar usuário' : 'Novo usuário'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nome</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="João Silva"
              className={inputCls}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="joao.silva"
              className={inputCls}
              autoComplete="off"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Função</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={inputCls}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar usuário'}
          </button>
        </form>
      </div>
    </div>
  )
}
