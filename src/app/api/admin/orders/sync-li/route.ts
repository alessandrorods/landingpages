import { NextRequest, NextResponse } from 'next/server'
import { createOrderDomain } from '@/domains/orders/order.domain'

// Called by cron jobs. Accepts either a CRON_SECRET bearer token or a valid admin session.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET

  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    const { getRequestRole } = await import('@/domains/admin/auth')
    const { can } = await import('@/domains/admin/permissions')
    const role = getRequestRole(request)
    if (!can(role, 'dispatchOrder')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
  }

  try {
    const { liSyncService } = createOrderDomain(process.env.TINY_TOKEN ?? '')
    if (!liSyncService) return NextResponse.json({ ok: true })
    await liSyncService.processAllPending()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sync-li] reconciliation falhou', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
