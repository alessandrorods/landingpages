﻿import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/clients/olist/client'
import { getOrderCached } from '@/core/cache/pedido.cache'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import type { OlistOrderStatus, OlistOrderDetails } from '@/clients/olist/types'

const VALID: OlistOrderStatus[] = [
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
  if (!can(getRequestRole(request), 'viewOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const situacao = searchParams.get('situacao') as OlistOrderStatus | null
  const summary = searchParams.get('summary') === 'true'
  const dataAtualizacao = searchParams.get('dataAtualizacao') ?? undefined

  if (!situacao || !VALID.includes(situacao)) {
    return NextResponse.json({ error: 'situacao inválida' }, { status: 400 })
  }

  const tag = `[orders] situacao=${situacao} summary=${summary}`

  const token = process.env.TINY_TOKEN
  if (!token) {
    console.error(tag, 'TINY_TOKEN não configurado')
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  try {
    const client = createOlistClient(token)

    const buscarOpts = summary
      ? { dataAtualizacao }
      : { dataInicial: dataInicial30d(), dataAtualizacao }

    const listData = await client.listOrders(situacao, buscarOpts)

    // codigo_erro 20 = sem registros — não é erro real
    if (listData.retorno?.status !== 'OK') {
      if (listData.retorno?.codigo_erro === 20) {
        return summary ? NextResponse.json({ resumos: [] }) : NextResponse.json({ pedidos: [] })
      }
      console.error(tag, 'listOrders falhou', listData.retorno)
      return summary ? NextResponse.json({ resumos: [] }) : NextResponse.json({ pedidos: [] })
    }

    const resumos = (listData.retorno?.pedidos ?? []).map((p) => p.pedido)

    if (summary) {
      return NextResponse.json({ resumos })
    }

    if (resumos.length === 0) return NextResponse.json({ pedidos: [] })

    let falhas = 0
    const tasks = resumos.map((r) => async (): Promise<OlistOrderDetails | null> => {
      try {
        const detail = await getOrderCached(r.id)
        if (detail.retorno?.status !== 'OK') {
          console.error(tag, `getOrder falhou para id=${r.id}`, detail.retorno)
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
    const pedidos = detalhes.filter(Boolean) as OlistOrderDetails[]

    if (falhas > 0) {
      console.error(tag, `${falhas}/${resumos.length} pedidos falharam ao obter detalhes`)
    }

    return NextResponse.json({ pedidos })
  } catch (err) {
    console.error(tag, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno ao listar pedidos' }, { status: 500 })
  }
}
