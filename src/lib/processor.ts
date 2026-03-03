import path from 'path'
import { prisma } from './db'
import { extractEntities, updateClusterSummary } from './ai'
import { findMatchingCluster, calculateScore, mergeLists } from './clusterer'
import { broadcast } from './broadcaster'
import type { Cluster, Media } from './types'

// ── Serialisation ──────────────────────────────────────────────────────────

function serializeCluster(
  cluster: {
    id: number; createdAt: Date; updatedAt: Date; headline: string | null
    summary: string | null; category: string | null; countries: string
    actors: string; score: number; channelCount: number; isProcessed: boolean
  },
  media: { id: number; mediaType: string; filePath: string }[],
): Cluster {
  return {
    id: cluster.id,
    createdAt: cluster.createdAt.toISOString(),
    updatedAt: cluster.updatedAt.toISOString(),
    headline: cluster.headline,
    summary: cluster.summary,
    category: cluster.category,
    countries: JSON.parse(cluster.countries),
    actors: JSON.parse(cluster.actors),
    score: cluster.score,
    channelCount: cluster.channelCount,
    isProcessed: cluster.isProcessed,
    media: media.map(m => ({
      id: m.id,
      mediaType: m.mediaType as Media['mediaType'],
      url: `/api/media/${path.basename(m.filePath)}`,
    })),
  }
}

// ── Main pipeline ──────────────────────────────────────────────────────────

export async function processMessage({
  channelUsername,
  messageId,
  text,
  timestamp,
  mediaPaths,
}: {
  channelUsername: string
  messageId: number
  text: string
  timestamp: Date
  mediaPaths: Array<{ filePath: string; mediaType: string }>
}) {
  // 1. Resolve channel
  const channel = await prisma.channel.findUnique({
    where: { telegramUsername: channelUsername },
  })
  if (!channel || !channel.isActive) return

  // 2. Deduplicate (unique constraint on channelId + messageId)
  const exists = await prisma.newsItem.findUnique({
    where: { channelId_messageId: { channelId: channel.id, messageId } },
  })
  if (exists) return

  // 3. AI entity extraction (non-blocking — runs in background)
  const extracted = await extractEntities(text)

  // Discard if AI explicitly says this is not news
  if (extracted && extracted.is_news === false) return

  const countries: string[] = extracted?.countries ?? []
  const actors: string[]    = extracted?.actors    ?? []
  const category: string    = extracted?.category  ?? 'other'
  const headline            = extracted?.headline  ?? null
  const summary             = extracted?.summary   ?? null

  // 4. Find or create cluster
  const existingCluster = await findMatchingCluster(countries, actors, category)

  let cluster: Awaited<ReturnType<typeof prisma.newsCluster.create>>
  let eventType: 'cluster_created' | 'cluster_updated'

  if (!existingCluster) {
    // New story
    cluster = await prisma.newsCluster.create({
      data: {
        createdAt: timestamp,
        headline,
        summary,
        category,
        countries: JSON.stringify(countries),
        actors: JSON.stringify(actors),
        channelCount: 1,
        score: calculateScore([channel.reliability]),
        isProcessed: !!extracted,
      },
    })
    eventType = 'cluster_created'
  } else {
    // Merge into existing cluster
    const existingItems = await prisma.newsItem.findMany({
      where: { clusterId: existingCluster.id },
      select: { channel: { select: { id: true, reliability: true } } },
    })

    // Deduplicate reliabilities by channel
    const reliabilityMap = new Map(existingItems.map(i => [i.channel.id, i.channel.reliability]))
    reliabilityMap.set(channel.id, channel.reliability)
    const reliabilities = Array.from(reliabilityMap.values())

    const mergedCountries = mergeLists(JSON.parse(existingCluster.countries), countries)
    const mergedActors    = mergeLists(JSON.parse(existingCluster.actors), actors)

    // Re-summarise with AI if we have a previous summary
    let updatedHeadline = existingCluster.headline
    let updatedSummary  = existingCluster.summary

    if (extracted && existingCluster.summary) {
      const allTexts = await prisma.newsItem
        .findMany({ where: { clusterId: existingCluster.id }, select: { text: true } })
        .then(items => [...items.map(i => i.text), text])

      const updated = await updateClusterSummary(allTexts, existingCluster.summary)
      if (updated) {
        updatedHeadline = updated.headline ?? updatedHeadline
        updatedSummary  = updated.summary  ?? updatedSummary
        if (updated.countries?.length) {
          for (const c of updated.countries) {
            if (!mergedCountries.map(x => x.toLowerCase()).includes(c.toLowerCase()))
              mergedCountries.push(c)
          }
        }
        if (updated.actors?.length) {
          for (const a of updated.actors) {
            if (!mergedActors.map(x => x.toLowerCase()).includes(a.toLowerCase()))
              mergedActors.push(a)
          }
        }
      }
    }

    cluster = await prisma.newsCluster.update({
      where: { id: existingCluster.id },
      data: {
        headline:     updatedHeadline,
        summary:      updatedSummary,
        countries:    JSON.stringify(mergedCountries),
        actors:       JSON.stringify(mergedActors),
        channelCount: reliabilityMap.size,
        score:        calculateScore(reliabilities),
        isProcessed:  !!extracted,
      },
    })
    eventType = 'cluster_updated'
  }

  // 5. Create NewsItem
  const item = await prisma.newsItem.create({
    data: {
      clusterId: cluster.id,
      channelId: channel.id,
      messageId,
      text,
      timestamp,
      processed: true,
    },
  })

  // 6. Save media
  for (const { filePath, mediaType } of mediaPaths) {
    await prisma.media.create({
      data: { clusterId: cluster.id, newsItemId: item.id, mediaType, filePath },
    })
  }

  // 7. Broadcast SSE event with fresh media list
  const media = await prisma.media.findMany({ where: { clusterId: cluster.id } })
  broadcast({ type: eventType, data: serializeCluster(cluster, media) })
}
