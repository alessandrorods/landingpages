import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, getRequestUsername, getRequestDisplayName } from '@/domains/admin/auth'
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
  if (!can(getRequestRole(request), 'deliverOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: { recebidoPor?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { recebidoPor } = body
  if (!recebidoPor?.trim()) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const role = getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const username = getRequestUsername(request)
  if (!username) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const courier = await createUserRepository().findByUsername(username)
  if (!courier) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))
    const courierName = getRequestDisplayName(request) ?? username
    await orderService.deliver(id, recebidoPor.trim(), courier.id, courierName, { type: 'user', name: courierName, role })
    after(() => syncService.processPendingFor(id).catch((err) =>
      console.error('[deliver] sync after-deliver falhou', { orderId: id, err }),
    ))
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error(`[deliver] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
