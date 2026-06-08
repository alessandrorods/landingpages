﻿import { createOlistClient } from '@/clients/olist/client'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function GET(request: Request) {
  const role = getRequestRole(request)
  if (!can(role, 'searchProducts')) {
    return Response.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return Response.json({ error: 'Parâmetro q obrigatório' }, { status: 400 })

  try {
    const client = createOlistClient(getEnv('TINY_TOKEN'))
    const data = await client.listProducts(q)

    if (data.retorno?.status !== 'OK') {
      const erros = (data.retorno?.erros ?? []).map((e) => e.erro).join('; ')
      if (data.retorno?.codigo_erro === 4) {
        return Response.json({ produtos: [] })
      }
      return Response.json({ error: erros || 'Erro ao buscar produtos' }, { status: 502 })
    }

    const produtos = (data.retorno?.produtos ?? []).map(({ produto: p }) => ({
      id: p.id,
      sku: p.codigo,
      nome: p.nome,
      preco: parseFloat(p.preco) || 0,
    }))

    return Response.json({ produtos })
  } catch (err) {
    console.error('[products/search] erro', err)
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
