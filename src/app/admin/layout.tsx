import { headers } from 'next/headers'
import AdminHeader from './AdminHeader'
import { UserProvider } from '@/contexts/UserContext'
import type { Role } from '@/domains/admin/auth'

export const metadata = { title: 'Operacional | Mundo Planta', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = (await headers()).get('x-admin-role') as Role | null

  if (!role) {
    return (
      <div className="admin-root min-h-screen bg-gray-50">
        <main className="w-full px-4 pb-24 pt-4">{children}</main>
      </div>
    )
  }

  return (
    <UserProvider role={role}>
      <div className="admin-root min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="w-full px-4 pb-24 pt-4">{children}</main>
      </div>
    </UserProvider>
  )
}
