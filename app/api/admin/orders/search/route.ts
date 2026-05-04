import { NextRequest, NextResponse } from 'next/server'
import { createOlistClient } from '@/lib/olist/client'
import { getRequestRole } from '@/lib/admin/auth'

export async function GET(request: NextRequest) {
  const role = getRequestRole(request)
  if (!role || !['vendas', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const numero = request.nextUrl.searchParams.get('numero')?.trim()
  if (!numero) {
    return NextResponse.json({ error: 'Parâmetro numero obrigatório' }, { status: 400 })
  }

  const tag = `[search] numero=${numero}`

  const token = process.env.TINY_TOKEN
  if (!token) {
    console.error(tag, 'TINY_TOKEN não configurado')
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  try {
    const client = createOlistClient(token)

    const listData = await client.buscarPedidoPorNumero(numero)

    if (listData.retorno?.status !== 'OK') {
      if (listData.retorno?.codigo_erro === 20) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
      }
      console.error(tag, 'busca falhou', listData.retorno)
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (!listData.retorno?.pedidos?.length) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const resumo = listData.retorno.pedidos.find(
      (p) => String(p.pedido.numero) === numero,
    )
    if (!resumo) {
      console.error(tag, 'número não encontrado entre os resultados', listData.retorno.pedidos.map((p) => p.pedido.numero))
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const detail = await client.obterPedido(resumo.pedido.id)
    if (detail.retorno?.status !== 'OK' || !detail.retorno.pedido) {
      console.error(tag, 'obterPedido falhou', detail.retorno)
      return NextResponse.json({ error: 'Erro ao obter detalhes do pedido' }, { status: 422 })
    }

    return NextResponse.json({ pedido: detail.retorno.pedido })
  } catch (err) {
    console.error(tag, 'erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno ao buscar pedido' }, { status: 500 })
  }
}
