import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOlistClient } from '@/clients/olist/client'

const OLIST_FORMA_ENVIO_ID = '770129486'

function getEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var ${key}`)
  return v
}

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageConfig')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const client = createOlistClient(getEnv('TINY_TOKEN'))
    const result = await client.getShippingMethods(OLIST_FORMA_ENVIO_ID)
    const methods = result.retorno?.forma_envio?.formas_frete ?? []
    return NextResponse.json({ methods })
  } catch (err) {
    console.error('[olist] getShippingMethods falhou', err)
    return NextResponse.json({ error: 'Não foi possível buscar os métodos de frete' }, { status: 502 })
  }
}
