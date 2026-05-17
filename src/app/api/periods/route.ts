import { NextResponse } from 'next/server'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'

export async function GET() {
  const periods = await createConfigService(createConfigRepository()).get('deliveryPeriods')
  return NextResponse.json({ periods })
}
