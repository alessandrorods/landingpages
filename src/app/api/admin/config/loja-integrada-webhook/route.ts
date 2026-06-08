import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'
import { createLIClient } from '@/clients/loja-integrada/client'
import { hmacSign } from '@/core/signing'

function getEnvOrThrow(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`${key} não configurado`)
  return v
}

function configService() {
  return createConfigService(createConfigRepository())
}

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageConfig')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const liClient = createLIClient(getEnvOrThrow('LI_CHAVE_API'), getEnvOrThrow('LI_CHAVE_APLICACAO'))
    const webhookInfo = await liClient.getWebhook()
    const secret = await configService().get('liWebhookSecret')
    return NextResponse.json({ webhookInfo, secretConfigured: !!secret })
  } catch (err) {
    console.error('[li-webhook-config] GET erro', err)
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageConfig')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { secret?: string; notifyUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { secret, notifyUrl } = body
  if (!secret || !notifyUrl) {
    return NextResponse.json({ error: 'secret e notifyUrl são obrigatórios' }, { status: 400 })
  }

  try {
    await configService().set('liWebhookSecret', secret)
    const token = await hmacSign(secret)
    const liClient = createLIClient(getEnvOrThrow('LI_CHAVE_API'), getEnvOrThrow('LI_CHAVE_APLICACAO'))
    await liClient.registerWebhook(notifyUrl, token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[li-webhook-config] POST erro', err)
    return NextResponse.json({ error: 'Erro ao registrar webhook' }, { status: 500 })
  }
}
