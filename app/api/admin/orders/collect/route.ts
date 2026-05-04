import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createOlistClient } from '@/lib/olist/client'
import { obterPedidoCached } from '@/lib/olist/pedido-cache'
import { getRequestRole } from '@/lib/admin/auth'

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

// Tudo antes do divisor é conteúdo original do pedido — preservado.
// Tudo depois é nosso — substituído a cada operação.
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

  // Original longo demais: trunca pelo início para garantir que nossa seção caiba
  const slack = MAX - sepAndSection.length
  return slack > 0
    ? `${original.slice(0, slack)}${sepAndSection}`
    : sepAndSection.slice(0, MAX)
}

export async function POST(request: NextRequest) {
  const role = getRequestRole(request)
  if (!role) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { numero?: string; motoboy?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { numero, motoboy } = body
  if (!numero?.trim() || !motoboy?.trim()) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const token = process.env.TINY_TOKEN
  if (!token) {
    console.error('[collect] TINY_TOKEN não configurado')
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  const tag = `[collect] pedido=${numero} motoboy=${motoboy}`

  try {
    const client = createOlistClient(token)

    const listData = await client.buscarPedidoPorNumero(numero.trim())

    if (listData.retorno?.status !== 'OK') {
      console.error(tag, 'busca falhou', listData.retorno)
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const resumos = listData.retorno?.pedidos ?? []
    if (resumos.length === 0) {
      console.error(tag, 'nenhum resultado na busca')
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const pedido = resumos.find((r) => String(r.pedido.numero) === numero.trim())?.pedido
    if (!pedido) {
      console.error(tag, 'número não encontrado entre os resultados', resumos.map((r) => r.pedido.numero))
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const situacaoNorm = pedido.situacao?.toLowerCase()
    if (!situacaoNorm?.includes('pronto')) {
      console.error(tag, `situação inválida para coleta: "${pedido.situacao}"`)
      return NextResponse.json(
        { error: `Pedido não está pronto para coleta (situação: ${pedido.situacao})` },
        { status: 422 },
      )
    }

    const detalhe = await obterPedidoCached(pedido.id)
    const obsAtual = detalhe.retorno?.pedido?.obs

    const ourSection = `Saiu para entrega: ${fmtDate(new Date())}\nMotoboy: ${motoboy.trim()}`
    const obs = buildObs(obsAtual, ourSection)

    const [alterarRes, situacaoRes] = await Promise.all([
      client.alterarPedido(pedido.id, { obs }),
      client.atualizarSituacaoPedido(pedido.id, 'enviado'),
    ])

    if (alterarRes.retorno?.status !== 'OK') {
      console.error(tag, 'alterarPedido (obs) falhou — não crítico', alterarRes.retorno)
    }

    if (situacaoRes.retorno?.status !== 'OK') {
      const erros = (situacaoRes.retorno?.erros ?? []).map((e) => e.erro).join('; ')
      console.error(tag, 'atualizarSituacao falhou', situacaoRes.retorno)
      return NextResponse.json({ error: erros || 'Erro ao atualizar situação' }, { status: 422 })
    }

    revalidateTag(`pedido-${pedido.id}`)
    console.log(tag, 'coleta registrada com sucesso', { obs, obsGravada: alterarRes.retorno?.status === 'OK' })
    return NextResponse.json({ ok: true, numero: pedido.numero })
  } catch (err) {
    console.error(tag, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno ao processar coleta' }, { status: 500 })
  }
}
