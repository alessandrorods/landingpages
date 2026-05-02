import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/lib/olist/client'

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: { recebidoPor?: string; motoboy?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { recebidoPor, motoboy } = body
  if (!recebidoPor?.trim() || !motoboy?.trim()) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const token = process.env.TINY_TOKEN
  if (!token) return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })

  const client = createOlistClient(token)
  const now = fmtDate(new Date())

  // "Entregue 10/05/2026 14:35. MB: João. Recebeu: Maria" — max 100 chars
  const obs = `Entregue ${now}. MB: ${motoboy.trim()}. Recebeu: ${recebidoPor.trim()}`.slice(0, 100)

  const [alterarRes, situacaoRes] = await Promise.all([
    client.alterarPedido(Number(id), { obs }),
    client.atualizarSituacaoPedido(Number(id), 'entregue'),
  ])

  if (alterarRes.retorno?.status !== 'OK') {
    const erros = (alterarRes.retorno?.erros ?? []).map((e) => e.erro).join('; ')
    return NextResponse.json({ error: erros || 'Erro ao registrar entrega' }, { status: 422 })
  }

  if (situacaoRes.retorno?.status !== 'OK') {
    const erros = (situacaoRes.retorno?.erros ?? []).map((e) => e.erro).join('; ')
    return NextResponse.json({ error: erros || 'Erro ao atualizar situação' }, { status: 422 })
  }

  return NextResponse.json({ ok: true })
}
