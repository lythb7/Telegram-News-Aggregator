'use client'

import { useEffect, useState } from 'react'
import type { Cluster, ClusterDetail } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { CategoryBadge } from './CategoryBadge'
import { ScoreBadge } from './ScoreBadge'
import { MediaGallery } from './MediaGallery'

interface Props {
  cluster: Cluster
  onClose: () => void
}

export function ClusterModal({ cluster, onClose }: Props) {
  const [detail, setDetail] = useState<ClusterDetail | null>(null)

  useEffect(() => {
    fetch(`/api/news/${cluster.id}`)
      .then(r => r.json())
      .then(setDetail)
      .catch(console.error)
  }, [cluster.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Sheet / modal */}
      <div
        className="relative z-10 w-full sm:max-w-2xl bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-2xl max-h-[92dvh] flex flex-col sheet-enter"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-4 border-b border-gray-800">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <CategoryBadge category={cluster.category} />
              <span className="text-xs text-gray-500">
                {cluster.channelCount} {cluster.channelCount === 1 ? 'source' : 'sources'}
              </span>
              <span className="text-xs text-gray-600">
                {formatRelativeTime(cluster.updatedAt)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-100 leading-snug">
              {cluster.headline ?? 'Report incoming…'}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ScoreBadge score={cluster.score} />
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Summary */}
          {cluster.summary && (
            <p className="text-gray-300 leading-relaxed">{cluster.summary}</p>
          )}

          {/* Entity tags */}
          {(cluster.countries.length > 0 || cluster.actors.length > 0) && (
            <div className="space-y-2">
              {cluster.countries.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cluster.countries.map(c => (
                    <span key={c} className="chip bg-gray-800 text-gray-300 border-gray-700">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {cluster.actors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cluster.actors.map(a => (
                    <span key={a} className="chip bg-indigo-900/30 text-indigo-300 border-indigo-700/40">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Media */}
          <MediaGallery media={cluster.media} />

          {/* Source reports */}
          {detail && detail.items.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Source Reports
              </h3>
              <div className="space-y-3">
                {detail.items.map(item => (
                  <div key={item.id} className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-200">
                          {item.channel.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          @{item.channel.telegramUsername}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          reliability {item.channel.reliability.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap text-arabic">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!detail && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
