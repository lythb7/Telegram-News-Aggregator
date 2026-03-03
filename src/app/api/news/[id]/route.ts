import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const cluster = await prisma.newsCluster.findUnique({
    where: { id: parseInt(id) },
    include: {
      media: true,
      items: {
        include: { channel: true },
        orderBy: { timestamp: 'asc' },
      },
    },
  })

  if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id:           cluster.id,
    createdAt:    cluster.createdAt,
    updatedAt:    cluster.updatedAt,
    headline:     cluster.headline,
    summary:      cluster.summary,
    category:     cluster.category,
    countries:    JSON.parse(cluster.countries),
    actors:       JSON.parse(cluster.actors),
    score:        cluster.score,
    channelCount: cluster.channelCount,
    isProcessed:  cluster.isProcessed,
    media: cluster.media.map(m => ({
      id:        m.id,
      mediaType: m.mediaType,
      url:       `/api/media/${path.basename(m.filePath)}`,
    })),
    items: cluster.items.map(item => ({
      id:        item.id,
      text:      item.text,
      timestamp: item.timestamp,
      channel:   item.channel,
    })),
  })
}
