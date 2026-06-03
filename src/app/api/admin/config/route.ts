import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService, ConfigServiceError } from '@/domains/config/config.service'
import type { ConfigKey } from '@/domains/config/config.types'

function configService() {
  return createConfigService(createConfigRepository())
}

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageConfig')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const config = await configService().list()
  return NextResponse.json({ config })
}

export async function PATCH(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageConfig')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { key?: string; value?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { key, value } = body
  if (!key) return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })

  try {
    const updated = await configService().set(key as ConfigKey, value)
    return NextResponse.json({ ok: true, value: updated })
  } catch (err) {
    if (err instanceof ConfigServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error('[config] PATCH erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
