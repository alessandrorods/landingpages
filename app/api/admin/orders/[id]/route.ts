import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/lib/olist/client'
import { getRequestRole } from '@/lib/admin/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getRequestRole(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params
  const token = process.env.TINY_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  try {
    const client = createOlistClient(token)
    const data = await client.obterPedido(Number(id))

    if (data.retorno?.status !== 'OK') {
      const erros = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
      return NextResponse.json({ error: erros || 'Pedido não encontrado' }, { status: 404 })
    }

    const pedido = data.retorno.pedido
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ pedido })
  } catch (err) {
    console.error(`[order] id=${id} erro inesperado`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
