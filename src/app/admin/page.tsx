import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Role } from '@/domains/admin/auth'

const AREAS: { roles: Role[]; label: string; icon: string; desc: string; href: string }[] = [
  { roles: ['expedicao', 'admin'],        label: 'Painel da Operação',  icon: '📊', desc: 'Visão completa de todos os pedidos',  href: '/admin/painel'    },
  { roles: ['vendas', 'admin'],          label: 'Vendas',             icon: '💰', desc: 'Pedidos pagos e recuperação',           href: '/admin/vendas'    },
  { roles: ['florista', 'admin'],        label: 'Florista',           icon: '🌸', desc: 'Montagem dos pedidos',                  href: '/admin/florista'  },
  { roles: ['expedicao', 'admin'],       label: 'Fila de Despacho',   icon: '📋', desc: 'Agrupamento de pedidos prontos',        href: '/admin/fila'      },
  { roles: ['motoboy', 'admin'],         label: 'Motoboy',            icon: '🏍️', desc: 'Confirmação de entregas',               href: '/admin/motoboy'   },
  { roles: ['admin'],                    label: 'Usuários',           icon: '🧑', desc: 'Gerenciar usuários',                    href: '/admin/users'     },
  { roles: ['admin'],                    label: 'Configurações',      icon: '⚙️', desc: 'Parâmetros do sistema',                 href: '/admin/settings'  },
]

export default async function AdminPage() {
  const role = (await headers()).get('x-admin-role') as Role | null

  const accessible = role ? AREAS.filter((a) => a.roles.includes(role)) : AREAS

  // Single-area roles (vendas, florista, motoboy) go directly to their page
  if (role && accessible.length === 1) {
    redirect(accessible[0].href)
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Selecione a área</p>

      <div className="space-y-3">
        {accessible.map((a) => (
          <Link key={a.href} href={a.href}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow transition-all">
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
