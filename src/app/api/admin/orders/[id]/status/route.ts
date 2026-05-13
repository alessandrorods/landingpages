﻿import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createOlistClient } from '@/clients/olist/client'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import type { OlistOrderStatus } from '@/clients/olist/types'

const VALID: OlistOrderStatus[] = [
  'aberto', 'aprovado', 'preparando_envio', 'faturado',
  'pronto_envio', 'enviado', 'entregue', 'nao_entregue', 'cancelado',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = getRequestRole(request)
  if (!can(role, 'updateOrderStatus')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params

  let body: { situacao?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { situacao } = body
  if (!situacao || !VALID.includes(situacao as OlistOrderStatus)) {
    return NextResponse.json({ error: 'situacao inválida' }, { status: 400 })
  }

  const tag = `[status] id=${id} situacao=${situacao}`

  const token = process.env.TINY_TOKEN
  if (!token) {
    console.error(tag, 'TINY_TOKEN não configurado')
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  try {
    const client = createOlistClient(token)
    const data = await client.updateOrderStatus(Number(id), situacao as OlistOrderStatus)

    if (data.retorno?.status !== 'OK') {
      const erros = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
      console.error(tag, 'atualizarSituacao falhou', data.retorno)
      return NextResponse.json({ error: erros || 'Erro ao atualizar' }, { status: 422 })
    }

    revalidateTag(`pedido-${id}`, { expire: 0 })
    console.log(tag, 'status atualizado com sucesso')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(tag, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar status' }, { status: 500 })
  }
}
