import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { verifyPhotoRef, isTrustedBlobUrl } from '@/core/photo/signedUrl'

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'viewOrders')) {
    return new NextResponse(null, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')
  const ts  = searchParams.get('ts')
  const sig = searchParams.get('sig')

  if (!ref || !ts || !sig) return new NextResponse(null, { status: 400 })

  const blobUrl = await verifyPhotoRef(ref, ts, sig)
  if (!blobUrl || !isTrustedBlobUrl(blobUrl)) {
    return new NextResponse(null, { status: 403 })
  }

  const upstream = await fetch(blobUrl)
  if (!upstream.ok) return new NextResponse(null, { status: 404 })

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
