'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { ClusterCard } from './ClusterCard'
import { ClusterModal } from './ClusterModal'
import type { Cluster } from '@/lib/types'

export function NewsFeed() {
  const { clusters, isLoading, hasMore, loadMore } = useApp()
  const [selected, setSelected] = useState<Cluster | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Track which cluster IDs are "new" (arrived since mount)
  const mountedIds = useRef(new Set<number>())
  useEffect(() => {
    clusters.forEach(c => mountedIds.current.add(c.id))
  }, [clusters])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  // Update the selected cluster if it was updated via SSE
  useEffect(() => {
    if (!selected) return
    const updated = clusters.find(c => c.id === selected.id)
    if (updated && updated !== selected) setSelected(updated)
  }, [clusters, selected])

  if (!isLoading && clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 text-center px-4">
        <div className="text-4xl mb-4">📡</div>
        <p className="text-lg font-medium text-gray-400 mb-2">No news yet</p>
        <p className="text-sm max-w-xs">
          Add Telegram channels in the{' '}
          <a href="/admin" className="text-indigo-400 underline">admin panel</a>
          {' '}to start receiving news.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
        {clusters.map(cluster => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            isNew={!mountedIds.current.has(cluster.id)}
            onClick={() => setSelected(cluster)}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && clusters.length > 0 && (
        <p className="text-center text-xs text-gray-600 py-6">All caught up</p>
      )}

      {selected && (
        <ClusterModal cluster={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
