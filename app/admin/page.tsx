import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Role } from '@/lib/admin/auth'

const AREAS = [
  { role: 'vendas', label: 'Vendas', icon: '💰', desc: 'Pedidos pagos e recuperação', href: '/admin/vendas' },
  { role: 'florista', label: 'Florista', icon: '🌸', desc: 'Montagem dos pedidos', href: '/admin/florista' },
  { role: 'expedicao', label: 'Expedição', icon: '🚚', desc: 'Separação para rota', href: '/admin/expedicao' },
  { role: 'motoboy', label: 'Motoboy', icon: '🏍️', desc: 'Confirmação de entregas', href: '/admin/motoboy' },
]

export default async function AdminPage() {
  const role = (await headers()).get('x-admin-role') as Role | null

  if (role && role !== 'admin') {
    redirect(`/admin/${role}`)
  }

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Selecione a área</p>

      <div className="space-y-3">
        {AREAS.map((a) => (
          <Link
            key={a.role}
            href={a.href}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow transition-all"
          >
            <span className="text-3xl">{a.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">{a.label}</p>
              <p className="text-sm text-gray-500">{a.desc}</p>
            </div>
            <span className="ml-auto text-gray-300">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
