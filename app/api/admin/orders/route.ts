import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/lib/olist/client'
import { getRequestRole } from '@/lib/admin/auth'
import type { SituacaoPedido } from '@/lib/olist/types'

const VALID: SituacaoPedido[] = [
  'aberto', 'aprovado', 'preparando_envio', 'faturado',
  'pronto_envio', 'enviado', 'entregue', 'nao_entregue', 'cancelado',
]

function dataInicial30d(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export async function GET(request: NextRequest) {
  if (!getRequestRole(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const situacao = request.nextUrl.searchParams.get('situacao') as SituacaoPedido | null

  if (!situacao || !VALID.includes(situacao)) {
    return NextResponse.json({ error: 'situacao inválida' }, { status: 400 })
  }

  const token = process.env.TINY_TOKEN
  if (!token) {
    console.error('[orders] TINY_TOKEN não configurado')
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  try {
    const client = createOlistClient(token)
    const listData = await client.buscarPedidos(situacao, dataInicial30d())

    // codigo_erro 20 = sem registros — não é erro real
    if (listData.retorno?.status !== 'OK') {
      if (listData.retorno?.codigo_erro === 20) return NextResponse.json({ pedidos: [] })
      console.error('[orders]', situacao, 'buscarPedidos falhou', listData.retorno)
      return NextResponse.json({ pedidos: [] })
    }

    const pedidos = (listData.retorno?.pedidos ?? []).map((p) => p.pedido)
    return NextResponse.json({ pedidos })
  } catch (err) {
    console.error('[orders]', situacao, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno ao listar pedidos' }, { status: 500 })
  }
}
