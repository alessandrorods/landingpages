import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { OrderServiceError } from '@/domains/orders/order.service'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function POST(request: NextRequest) {
  if (!can(getRequestRole(request), 'collectOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { numero?: string; motoboy?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { numero, motoboy } = body
  if (!numero?.trim() || !motoboy?.trim()) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const tag = `[collect] pedido=${numero} motoboy=${motoboy}`

  try {
    const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))

    const order = await orderService.findByNumero(numero.trim())
    if (!order) {
      console.error(tag, 'pedido não encontrado no DB')
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.status !== 'ready') {
      console.error(tag, `situação inválida para coleta: "${order.status}"`)
      return NextResponse.json(
        { error: `Pedido não está pronto para coleta (situação: ${order.status})` },
        { status: 422 },
      )
    }

    await orderService.dispatch(order.id, motoboy.trim())
    after(() => syncService.processPendingFor(order.id).catch((err) =>
      console.error(tag, 'sync after-collect falhou', { orderId: order.id, err }),
    ))

    console.log(tag, 'coleta registrada', { orderId: order.id })
    return NextResponse.json({ ok: true, numero: order.olistNumero ?? order.id })
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error(tag, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
