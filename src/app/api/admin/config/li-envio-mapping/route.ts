import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService, ConfigServiceError } from '@/domains/config/config.service'
import { createLIClient } from '@/clients/loja-integrada/client'

function getEnvOrThrow(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`${key} não configurado`)
  return v
}

function configService() {
  return createConfigService(createConfigRepository())
}

// GET — returns LI shipping methods + current mapping
export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageConfig')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const liClient = createLIClient(getEnvOrThrow('LI_CHAVE_API'), getEnvOrThrow('LI_CHAVE_APLICACAO'))
    const [formasEnvio, mapping] = await Promise.all([
      liClient.listShippingMethods(),
      configService().get('liEnvioMapping'),
    ])

    // Only return active shipping methods
    const active = formasEnvio.objects.filter((f) => f.configuracoes.ativo)

    return NextResponse.json({ formasEnvio: active, mapping })
  } catch (err) {
    console.error('[li-envio-mapping] GET erro', err)
    return NextResponse.json({ error: 'Erro ao buscar formas de envio' }, { status: 500 })
  }
}

// PATCH — saves the full mapping
export async function PATCH(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageConfig')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { mapping?: Record<string, string> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  if (!body.mapping || typeof body.mapping !== 'object') {
    return NextResponse.json({ error: 'mapping é obrigatório' }, { status: 400 })
  }

  try {
    const updated = await configService().set('liEnvioMapping', body.mapping)
    return NextResponse.json({ ok: true, mapping: updated })
  } catch (err) {
    if (err instanceof ConfigServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error('[li-envio-mapping] PATCH erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
