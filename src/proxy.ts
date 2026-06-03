import type { NextRequest } from 'next/server'
import { analyticsMiddleware } from '@/middlewares/analytics'
import { authMiddleware } from '@/middlewares/auth'

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  analyticsMiddleware(headers)
  return authMiddleware(request, headers)
}

export const config = {
  matcher: ['/admin(.*)', '/api/admin(.*)', '/print(.*)'],
}
