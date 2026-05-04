import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/lib/olist/client'
import { obterPedidoCached } from '@/lib/olist/pedido-cache'
import { getRequestRole } from '@/lib/admin/auth'
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
  if (!getRequestRole(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const situacao = request.nextUrl.searchParams.get('situacao') as SituacaoPedido | null

  if (!situacao || !VALID.includes(situacao)) {
    return NextResponse.json({ error: 'situacao inválida' }, { status: 400 })
  }

  const tag = `[orders] situacao=${situacao}`

  const token = process.env.TINY_TOKEN
  if (!token) {
    console.error(tag, 'TINY_TOKEN não configurado')
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  try {
    const client = createOlistClient(token)

    const listData = await client.buscarPedidos(situacao, dataInicial30d())

    // codigo_erro 20 = sem registros — não é erro real
    if (listData.retorno?.status !== 'OK') {
      if (listData.retorno?.codigo_erro === 20) {
        return NextResponse.json({ pedidos: [] })
      }
      console.error(tag, 'buscarPedidos falhou', listData.retorno)
      return NextResponse.json({ pedidos: [] })
    }

    const resumos = (listData.retorno?.pedidos ?? []).map((p) => p.pedido)
    if (resumos.length === 0) return NextResponse.json({ pedidos: [] })

    let falhas = 0
    const tasks = resumos.map((r) => async (): Promise<TinyPedidoCompleto | null> => {
      try {
        const detail = await obterPedidoCached(r.id)
        if (detail.retorno?.status !== 'OK') {
          console.error(tag, `obterPedido falhou para id=${r.id}`, detail.retorno)
          falhas++
          return null
        }
        return detail.retorno.pedido ?? null
      } catch (err) {
        console.error(tag, `erro ao obter pedido id=${r.id}`, err)
        falhas++
        return null
      }
    })

    const detalhes = await withConcurrency(tasks, 3)
    const pedidos = detalhes.filter(Boolean) as TinyPedidoCompleto[]

    if (falhas > 0) {
      console.error(tag, `${falhas}/${resumos.length} pedidos falharam ao obter detalhes`)
    }

    return NextResponse.json({ pedidos })
  } catch (err) {
    console.error(tag, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno ao listar pedidos' }, { status: 500 })
  }
}
