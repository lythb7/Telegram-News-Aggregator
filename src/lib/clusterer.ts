import { prisma } from './db'

const WINDOW_HOURS = parseInt(process.env.CLUSTER_WINDOW_HOURS ?? '12')

function overlap(a: string[], b: string[]): number {
  const aLower = new Set(a.map(x => x.toLowerCase()))
  let count = 0
  for (const item of b) {
    if (aLower.has(item.toLowerCase())) count++
  }
  return count
}

/**
 * Find the best-matching recent cluster for a new message.
 *
 * Match rules (at least one must apply):
 *   - Same category AND ≥1 shared country AND ≥1 shared actor
 *   - ≥2 shared countries  (regardless of category)
 *   - ≥2 shared actors     (regardless of category)
 */
export async function findMatchingCluster(
  countries: string[],
  actors: string[],
  category: string,
) {
  const cutoff = new Date(Date.now() - WINDOW_HOURS * 3_600_000)

  const recent = await prisma.newsCluster.findMany({
    where: { createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  let best: (typeof recent)[0] | null = null
  let bestScore = 0

  for (const c of recent) {
    const cCountries = JSON.parse(c.countries) as string[]
    const cActors = JSON.parse(c.actors) as string[]

    const co = overlap(countries, cCountries)
    const ao = overlap(actors, cActors)
    const catMatch = c.category === category

    let score = 0
    if (catMatch && co >= 1 && ao >= 1) score = co + ao + 2
    else if (co >= 2) score = co
    else if (ao >= 2) score = ao

    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }

  return best
}

/**
 * Score formula: log2(n+1) × avg_reliability, normalised to 0–100.
 * Reference ceiling: 20 channels at reliability 10 → 100.
 */
export function calculateScore(reliabilities: number[]): number {
  if (!reliabilities.length) return 0
  const avg = reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length
  const raw = Math.log2(reliabilities.length + 1) * avg
  const ceiling = Math.log2(21) * 10
  return Math.min(Math.round((raw / ceiling) * 1000) / 10, 100)
}

export function mergeLists(existing: string[], incoming: string[]): string[] {
  const result = [...existing]
  const existingLower = new Set(existing.map(x => x.toLowerCase()))
  for (const item of incoming) {
    if (!existingLower.has(item.toLowerCase())) result.push(item)
  }
  return result
}
