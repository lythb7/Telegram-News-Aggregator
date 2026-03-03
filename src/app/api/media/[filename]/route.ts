import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

type Params = { params: Promise<{ filename: string }> }

const MIME: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  gif:  'image/gif',
  mp4:  'video/mp4',
  webm: 'video/webm',
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { filename } = await params

  // Sanitize — no path traversal
  const safe = path.basename(filename)
  const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads')
  const filePath   = path.join(uploadsDir, safe)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ext  = safe.split('.').pop()?.toLowerCase() ?? ''
  const mime = MIME[ext] ?? 'application/octet-stream'

  const buffer = fs.readFileSync(filePath)
  return new Response(buffer, {
    headers: {
      'Content-Type':  mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
