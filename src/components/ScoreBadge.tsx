'use client'

import { scoreColor } from '@/lib/utils'

export function ScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score)
  const colors  = scoreColor(score)

  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full ring-2 text-sm font-bold ${colors}`}
      title={`Reliability score: ${score}`}
    >
      {rounded}
    </span>
  )
}
