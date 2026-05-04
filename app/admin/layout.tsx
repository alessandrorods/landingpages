import { Suspense } from 'react'
import { headers } from 'next/headers'
import AdminHeader from './AdminHeader'
import type { Role } from '@/lib/admin/auth'

export const metadata = { title: 'Operacional | Mundo Planta', robots: { index: false } }

async function DynamicHeader() {
  const role = (await headers()).get('x-admin-role') as Role | null
  return role ? <AdminHeader role={role} /> : null
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense>
        <DynamicHeader />
      </Suspense>
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  )
}
