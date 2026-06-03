import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'viewOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const reasons = await createConfigService(createConfigRepository()).get('undeliveredReasons')
  return NextResponse.json({ reasons })
}
