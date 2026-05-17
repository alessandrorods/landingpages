import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, getRequestDisplayName } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { createUserRepository } from '@/domains/users/user.repository'
import { OrderServiceError } from '@/domains/orders/order.service'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!can(getRequestRole(request), 'dispatchOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: { courierName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { courierName } = body
  if (!courierName?.trim()) {
    return NextResponse.json({ error: 'Nome do motoboy obrigatório' }, { status: 400 })
  }

  const courier = await createUserRepository().findAll()
    .then((users) => users.find((u) => u.displayName === courierName.trim()) ?? null)
  if (!courier) {
    return NextResponse.json({ error: 'Motoboy não encontrado' }, { status: 422 })
  }

  const role = getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))
    await orderService.dispatch(id, courier.id, courier.displayName, { type: 'user', name: getRequestDisplayName(request) ?? role, role })
    after(() => syncService.processPendingFor(id).catch((err) =>
      console.error('[dispatch] sync after-dispatch falhou', { orderId: id, err }),
    ))
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error(`[dispatch] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
