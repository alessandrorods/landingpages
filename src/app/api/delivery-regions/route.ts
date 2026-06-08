import { NextResponse } from 'next/server'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'

export async function GET() {
  const service = createConfigService(createConfigRepository())
  const regions = await service.get('deliveryRegions')
  return NextResponse.json(regions, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  })
}
