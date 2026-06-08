import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminHeader from './AdminHeader'
import { UserProvider } from '@/contexts/UserContext'
import { COOKIE_NAME } from '@/domains/admin/auth'
import type { Role } from '@/domains/admin/auth'

export const metadata = { title: 'Operacional | Mundo Planta', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = (await headers()).get('x-admin-role') as Role | null
  const displayName = (await headers()).get('x-admin-displayname') ?? ''

  if (!role) {
    // Sem role header significa que o proxy não autenticou esta rota.
    // Isso é esperado para a página de login (PUBLIC_PATHS).
    // Se o cookie de sessão existe mas o role não foi setado, a sessão é inválida
    // (ex: formato antigo após mudança de schema) — forçamos novo login.
    const sessionCookie = (await cookies()).get(COOKIE_NAME)
    if (sessionCookie) {
      redirect('/admin/login')
    }

    return (
      <div className="admin-root min-h-screen bg-gray-50">
        <main className="w-full px-4 pb-24 pt-4 lg:pb-4">{children}</main>
      </div>
    )
  }

  return (
    <UserProvider role={role} displayName={displayName}>
      <div className="admin-root min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="w-full px-4 pb-24 pt-4 lg:pb-4">{children}</main>
      </div>
    </UserProvider>
  )
}
