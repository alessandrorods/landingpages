import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/lib/olist/client'
import type { SituacaoPedido, TinyPedidoCompleto } from '@/lib/olist/types'

const VALID: SituacaoPedido[] = [
  'aberto', 'aprovado', 'preparando_envio', 'faturado',
  'pronto_envio', 'enviado', 'entregue', 'nao_entregue', 'cancelado',
]

async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results = new Array<T>(tasks.length)
  let next = 0
  async function worker() {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

function dataInicial30d(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export async function GET(request: NextRequest) {
  const situacao = request.nextUrl.searchParams.get('situacao') as SituacaoPedido | null

  if (!situacao || !VALID.includes(situacao)) {
    return NextResponse.json({ error: 'situacao inválida' }, { status: 400 })
  }

  const token = process.env.TINY_TOKEN
  if (!token) return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })

  const client = createOlistClient(token)

  const listData = await client.buscarPedidos(situacao, dataInicial30d())

  // codigo_erro 20 = sem registros — não é erro real
  if (listData.retorno?.status !== 'OK') {
    return NextResponse.json({ pedidos: [] })
  }

  const resumos = (listData.retorno?.pedidos ?? []).map((p) => p.pedido)
  if (resumos.length === 0) return NextResponse.json({ pedidos: [] })

  const tasks = resumos.map((r) => async (): Promise<TinyPedidoCompleto | null> => {
    try {
      const detail = await client.obterPedido(r.id)
      return detail.retorno?.status === 'OK' ? (detail.retorno.pedido ?? null) : null
    } catch {
      return null
    }
  })

  const detalhes = await withConcurrency(tasks, 8)
  const pedidos = detalhes.filter(Boolean) as TinyPedidoCompleto[]

  return NextResponse.json({ pedidos })
}
