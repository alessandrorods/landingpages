'use client'

import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/lib/admin/auth'
import type { Role } from '@/lib/admin/auth'

export default function AdminHeader({ role }: { role: Role }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 leading-none">Mundo Planta</p>
          <p className="font-semibold text-gray-900 leading-tight">{ROLE_LABELS[role] ?? role}</p>
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
