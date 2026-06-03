import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  if (!can(getRequestRole(request), 'markUndelivered')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx. 10 MB)' }, { status: 400 })
  }

  const evidenceToken = process.env.BLOB_EVIDENCE_READ_WRITE_TOKEN
  if (!evidenceToken) throw new Error('BLOB_EVIDENCE_READ_WRITE_TOKEN not configured')

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const blob = await put(`ocorrencias/${randomUUID()}.${ext}`, file, {
    access: 'private',
    token: evidenceToken,
  })

  return NextResponse.json({ url: blob.url })
}
