import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createOlistClient } from '@/lib/olist/client'
import { obterPedidoCached } from '@/lib/olist/pedido-cache'
import { getRequestRole } from '@/lib/admin/auth'

function fmtDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('day')}/${get('month')} ${get('hour')}:${get('minute')}`
}

const DIVISOR = '\n---\n'

function buildObs(existing: string | undefined, ourSection: string): string {
  const MAX = 100
  const sepAndSection = `${DIVISOR}${ourSection}`

  const sepIdx = existing?.indexOf(DIVISOR) ?? -1
  const original = existing
    ? (sepIdx !== -1 ? existing.slice(0, sepIdx) : existing).trimEnd()
    : ''

  if (!original) return sepAndSection.slice(0, MAX)

  const full = `${original}${sepAndSection}`
  if (full.length <= MAX) return full

  const slack = MAX - sepAndSection.length
  return slack > 0
    ? `${original.slice(0, slack)}${sepAndSection}`
    : sepAndSection.slice(0, MAX)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = getRequestRole(request)
  if (!role) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params
  const tag = `[deliver] id=${id}`

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
  if (!token) {
    console.error(tag, 'TINY_TOKEN não configurado')
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  try {
    const client = createOlistClient(token)

    const detalhe = await obterPedidoCached(Number(id))
    const obsAtual = detalhe.retorno?.pedido?.obs

    const ourSection = `Entregue: ${fmtDate(new Date())}\nMotoboy: ${motoboy.trim()}\nRecebido por: ${recebidoPor.trim()}`
    const obs = buildObs(obsAtual, ourSection)

    const [alterarRes, situacaoRes] = await Promise.all([
      client.alterarPedido(Number(id), { obs }),
      client.atualizarSituacaoPedido(Number(id), 'entregue'),
    ])

    if (alterarRes.retorno?.status !== 'OK') {
      console.error(tag, 'alterarPedido (obs) falhou — não crítico', alterarRes.retorno)
    }

    if (situacaoRes.retorno?.status !== 'OK') {
      const erros = (situacaoRes.retorno?.erros ?? []).map((e) => e.erro).join('; ')
      console.error(tag, 'atualizarSituacao falhou', situacaoRes.retorno)
      return NextResponse.json({ error: erros || 'Erro ao atualizar situação' }, { status: 422 })
    }

    revalidateTag(`pedido-${id}`, { expire: 0 })
    console.log(tag, 'entrega registrada', { motoboy, recebidoPor, obs, obsGravada: alterarRes.retorno?.status === 'OK' })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(tag, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno ao registrar entrega' }, { status: 500 })
  }
}
