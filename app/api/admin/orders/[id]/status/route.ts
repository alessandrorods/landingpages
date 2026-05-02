import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/lib/olist/client'
import type { SituacaoPedido } from '@/lib/olist/types'

const VALID: SituacaoPedido[] = [
  'aberto', 'aprovado', 'preparando_envio', 'faturado',
  'pronto_envio', 'enviado', 'entregue', 'nao_entregue', 'cancelado',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: { situacao?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { situacao } = body
  if (!situacao || !VALID.includes(situacao as SituacaoPedido)) {
    return NextResponse.json({ error: 'situacao inválida' }, { status: 400 })
  }

  const token = process.env.TINY_TOKEN
  if (!token) return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })

  const client = createOlistClient(token)
  const data = await client.atualizarSituacaoPedido(Number(id), situacao as SituacaoPedido)

  if (data.retorno?.status !== 'OK') {
    const erros = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
    return NextResponse.json({ error: erros || 'Erro ao atualizar' }, { status: 422 })
  }

  return NextResponse.json({ ok: true })
}
