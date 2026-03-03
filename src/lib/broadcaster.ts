/**
 * Server-Sent Events broadcaster.
 * Uses a Node.js EventEmitter as a singleton so all API route invocations
 * share the same instance within the same process.
 */
import { EventEmitter } from 'events'
import type { Cluster } from './types'

export interface BroadcastEvent {
  type: 'cluster_created' | 'cluster_updated'
  data: Cluster
}

const globalForBroadcaster = globalThis as unknown as {
  broadcaster: EventEmitter
}

const broadcaster: EventEmitter =
  globalForBroadcaster.broadcaster ?? new EventEmitter()

// Support up to 500 concurrent SSE connections without warnings
broadcaster.setMaxListeners(500)

if (process.env.NODE_ENV !== 'production') {
  globalForBroadcaster.broadcaster = broadcaster
}

export function broadcast(event: BroadcastEvent) {
  broadcaster.emit('news', event)
}

export function subscribe(handler: (event: BroadcastEvent) => void): () => void {
  broadcaster.on('news', handler)
  return () => broadcaster.off('news', handler)
}
