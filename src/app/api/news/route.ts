import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { prisma } from '@/lib/db'

function serializeCluster(c: any) {
  return {
    id:           c.id,
    createdAt:    c.createdAt,
    updatedAt:    c.updatedAt,
    headline:     c.headline,
    summary:      c.summary,
    category:     c.category,
    countries:    JSON.parse(c.countries),
    actors:       JSON.parse(c.actors),
    score:        c.score,
    channelCount: c.channelCount,
    isProcessed:  c.isProcessed,
    media:        (c.media ?? []).map((m: any) => ({
      id:        m.id,
      mediaType: m.mediaType,
      url:       `/api/media/${path.basename(m.filePath)}`,
    })),
  }
}

export async function GET(req: NextRequest) {
  const sp       = req.nextUrl.searchParams
  const minScore = parseFloat(sp.get('minScore') ?? '0')
  const country  = sp.get('country')  ?? ''
  const actor    = sp.get('actor')    ?? ''
  const category = sp.get('category') ?? ''
  const limit    = Math.min(parseInt(sp.get('limit') ?? '50'), 200)
  const offset   = parseInt(sp.get('offset') ?? '0')

  const clusters = await prisma.newsCluster.findMany({
    where: { score: { gte: minScore } },
    include: { media: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
  })

  let result = clusters.map(serializeCluster)

  // JSON-column entity filters (applied in memory — SQLite has no native JSON ops)
  if (country)  result = result.filter(c => c.countries.includes(country))
  if (actor)    result = result.filter(c => c.actors.includes(actor))
  if (category) result = result.filter(c => c.category === category)

  return NextResponse.json(result)
}
