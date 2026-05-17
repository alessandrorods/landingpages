import { NextResponse } from 'next/server'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'

export async function GET() {
  const config = createConfigService(createConfigRepository())
  const [periods, preparationTimeMinutes] = await Promise.all([
    config.get('deliveryPeriods'),
    config.get('preparationTimeMinutes'),
  ])
  return NextResponse.json({ periods, preparationTimeMinutes })
}
