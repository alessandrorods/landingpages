'use client'
import { ROLE_LABELS } from '@/domains/admin/auth'
import type { UserDTO } from '../useUsers'

const ROLE_BADGE: Record<string, string> = {
  vendas:    'bg-blue-100 text-blue-700',
  florista:  'bg-pink-100 text-pink-700',
  expedicao: 'bg-yellow-100 text-yellow-700',
  motoboy:   'bg-orange-100 text-orange-700',
  admin:     'bg-purple-100 text-purple-700',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface UserTableProps {
  users: UserDTO[]
  loading: boolean
  error: string
  onEdit: (user: UserDTO) => void
  onPassword: (user: UserDTO) => void
  onDelete: (user: UserDTO) => void
}

export default function UserTable({ users, loading, error, onEdit, onPassword, onDelete }: UserTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{error}</p>
  }

  if (users.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Nenhum usuário cadastrado</p>
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.username} · Desde {formatDate(user.createdAt)}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
            <button
              onClick={() => onEdit(user)}
              className="text-xs font-medium text-gray-600 hover:text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onPassword(user)}
              className="text-xs font-medium text-gray-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Senha
            </button>
            <div className="flex-1" />
            <button
              onClick={() => onDelete(user)}
              className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Desativar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
