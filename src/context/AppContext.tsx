'use client'

import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react'
import type { Cluster, Filters, SSEMessage } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  clusters:       Cluster[]
  filters:        Filters
  setFilter:      (key: keyof Filters, value: string | number) => void
  clearFilters:   () => void
  isLoading:      boolean
  hasMore:        boolean
  loadMore:       () => void
  sseConnected:   boolean
  /** All countries / actors seen so far (for filter dropdowns) */
  allCountries:   string[]
  allActors:      string[]
}

const AppContext = createContext<AppContextValue | null>(null)

const DEFAULT_FILTERS: Filters = { minScore: 0, country: '', actor: '', category: '' }
const PAGE_SIZE = 50

// ── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clusters,     setClusters]     = useState<Cluster[]>([])
  const [filters,      setFilters]      = useState<Filters>(DEFAULT_FILTERS)
  const [isLoading,    setIsLoading]    = useState(false)
  const [hasMore,      setHasMore]      = useState(true)
  const [sseConnected, setSseConnected] = useState(false)
  const offsetRef = useRef(0)

  // Derived filter-option lists (built from loaded clusters)
  const allCountries = [...new Set(clusters.flatMap(c => c.countries))].sort()
  const allActors    = [...new Set(clusters.flatMap(c => c.actors))].sort()

  // ── Initial load ─────────────────────────────────────────────────────────

  const loadClusters = useCallback(async (reset = false) => {
    setIsLoading(true)
    const offset = reset ? 0 : offsetRef.current
    const params = new URLSearchParams({
      limit:    String(PAGE_SIZE),
      offset:   String(offset),
      minScore: String(filters.minScore),
      ...(filters.country  && { country:  filters.country }),
      ...(filters.actor    && { actor:    filters.actor }),
      ...(filters.category && { category: filters.category }),
    })
    try {
      const res  = await fetch(`/api/news?${params}`)
      const data = await res.json() as Cluster[]
      if (reset) {
        setClusters(data)
        offsetRef.current = data.length
      } else {
        setClusters(prev => [...prev, ...data])
        offsetRef.current += data.length
      }
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      console.error('Failed to load clusters:', e)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Re-fetch when filters change
  useEffect(() => { loadClusters(true) }, [loadClusters])

  // ── SSE (live updates) ────────────────────────────────────────────────────

  useEffect(() => {
    let es: EventSource
    let retryTimeout: ReturnType<typeof setTimeout>
    let retryDelay = 1000
    let active = true

    function connect() {
      if (!active) return
      es = new EventSource('/api/stream')

      es.onopen = () => {
        setSseConnected(true)
        retryDelay = 1000
      }

      es.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data) as SSEMessage
          if (msg.type === 'cluster_created' && msg.data) {
            const c = msg.data
            // Only prepend if it matches current client-side filters
            if (
              c.score >= filters.minScore &&
              (!filters.country  || c.countries.includes(filters.country))  &&
              (!filters.actor    || c.actors.includes(filters.actor))        &&
              (!filters.category || c.category === filters.category)
            ) {
              setClusters(prev => [c, ...prev])
            }
          } else if (msg.type === 'cluster_updated' && msg.data) {
            setClusters(prev =>
              prev.map(x => x.id === msg.data!.id ? msg.data! : x)
            )
          }
        } catch {}
      }

      es.onerror = () => {
        setSseConnected(false)
        es.close()
        if (active) {
          retryTimeout = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, 30_000)
            connect()
          }, retryDelay)
        }
      }
    }

    connect()

    return () => {
      active = false
      clearTimeout(retryTimeout)
      es?.close()
      setSseConnected(false)
    }
  }, [filters])  // reconnect with fresh filter state for insertion check

  // ── Actions ───────────────────────────────────────────────────────────────

  const setFilter = useCallback((key: keyof Filters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) loadClusters(false)
  }, [isLoading, hasMore, loadClusters])

  return (
    <AppContext.Provider value={{
      clusters, filters, setFilter, clearFilters,
      isLoading, hasMore, loadMore,
      sseConnected, allCountries, allActors,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
