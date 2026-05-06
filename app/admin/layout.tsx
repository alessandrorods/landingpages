import { headers } from 'next/headers'
import AdminHeader from './AdminHeader'
import type { Role } from '@/lib/admin/auth'

export const metadata = { title: 'Operacional | Mundo Planta', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = (await headers()).get('x-admin-role') as Role | null

  return (
    <div className="admin-root min-h-screen bg-gray-50">
      {role && <AdminHeader role={role} />}
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">{children}</main>
    </div>
  )
}
