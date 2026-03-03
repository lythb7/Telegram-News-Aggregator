'use client'

import { useState, useEffect } from 'react'
import type { Cluster } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { CategoryBadge } from './CategoryBadge'
import { ScoreBadge } from './ScoreBadge'
import { MediaGallery } from './MediaGallery'

interface Props {
  cluster:   Cluster
  isNew:     boolean
  onClick:   () => void
}

export function ClusterCard({ cluster, isNew, onClick }: Props) {
  const [updated, setUpdated] = useState(false)

  // Flash the card whenever it changes (after initial render)
  useEffect(() => {
    if (!isNew) {
      setUpdated(true)
      const t = setTimeout(() => setUpdated(false), 2000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster.updatedAt, cluster.channelCount, cluster.score])

  return (
    <article
      onClick={onClick}
      className={[
        'relative bg-gray-900 border rounded-xl p-4 cursor-pointer',
        'hover:border-indigo-500/50 transition-all duration-200',
        isNew    ? 'animate-slide-in border-indigo-500/30'    : 'border-gray-800',
        updated  ? 'animate-pulse-once border-amber-500/30'   : '',
      ].join(' ')}
    >
      {/* Top row: category + score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center flex-wrap gap-2">
          <CategoryBadge category={cluster.category} />
          {cluster.channelCount > 1 && (
            <span className="chip bg-gray-700/50 text-gray-300 border-gray-600">
              {cluster.channelCount} sources
            </span>
          )}
          {!cluster.isProcessed && (
            <span className="chip bg-gray-700/40 text-gray-500 border-gray-700 animate-pulse">
              processing…
            </span>
          )}
        </div>
        <ScoreBadge score={cluster.score} />
      </div>

      {/* Headline */}
      <h2 className="font-semibold text-gray-100 leading-snug mb-1 line-clamp-2">
        {cluster.headline ?? 'Incoming report…'}
      </h2>

      {/* Summary */}
      {cluster.summary && (
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-3">
          {cluster.summary}
        </p>
      )}

      {/* Countries */}
      {cluster.countries.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cluster.countries.slice(0, 5).map(c => (
            <span key={c} className="chip bg-gray-800 text-gray-300 border-gray-700 text-xs">
              {c}
            </span>
          ))}
          {cluster.countries.length > 5 && (
            <span className="text-xs text-gray-500">+{cluster.countries.length - 5}</span>
          )}
        </div>
      )}

      {/* Actors */}
      {cluster.actors.length > 0 && (
        <p className="text-xs text-gray-500 truncate mb-2">
          {cluster.actors.slice(0, 4).join(' · ')}
          {cluster.actors.length > 4 ? ` · +${cluster.actors.length - 4}` : ''}
        </p>
      )}

      {/* Media thumbnails */}
      <MediaGallery media={cluster.media.slice(0, 4)} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-600">
          {formatRelativeTime(cluster.updatedAt)}
        </span>
        <span className="text-xs text-indigo-400 font-medium">Read more →</span>
      </div>
    </article>
  )
}
