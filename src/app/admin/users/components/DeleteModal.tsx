'use client'
import { useState } from 'react'
import type { UserDTO } from '../useUsers'

interface DeleteModalProps {
  user: UserDTO
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function DeleteModal({ user, onConfirm, onClose }: DeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Desativar usuário</h2>
        <p className="text-sm text-gray-600 mb-4">
          O usuário <span className="font-semibold text-gray-900">@{user.username}</span> será desativado e não poderá mais acessar o sistema. Esta ação pode ser revertida pelo banco de dados.
        </p>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </div>
    </div>
  )
}
