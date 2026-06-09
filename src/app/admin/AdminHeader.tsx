'use client'
import { ROLE_LABELS } from '@/domains/admin/auth'
import { useRequiredUser } from '@/contexts/UserContext'
import Link from 'next/link'

export default function AdminHeader() {
  const { role } = useRequiredUser()
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    localStorage.removeItem('_dq_session')
    window.location.href = '/admin/login'
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-0 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 leading-none">Mundo Planta</p>
          <p className="font-semibold text-gray-900 leading-tight"><Link href={role == 'admin' ? '/admin' : `/admin/${role}`}>{ROLE_LABELS[role] ?? role}</Link></p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-3 py-1.5"
        >
          Sair
        </button>
      </div>
    </header>
  )
}
