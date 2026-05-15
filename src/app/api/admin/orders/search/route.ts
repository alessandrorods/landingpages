import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'searchOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const numero = request.nextUrl.searchParams.get('numero')?.trim()
  if (!numero) {
    return NextResponse.json({ error: 'Parâmetro numero obrigatório' }, { status: 400 })
  }

  try {
    const { orderService } = createOrderDomain(getEnv('TINY_TOKEN'))
    const order = await orderService.findByNumero(numero)
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ order })
  } catch (err) {
    console.error(`[search] numero=${numero} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
