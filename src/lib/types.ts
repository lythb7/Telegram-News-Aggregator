export interface Channel {
  id: number
  telegramUsername: string
  name: string
  reliability: number
  language: string
  isActive: boolean
  createdAt: string
}

export interface Media {
  id: number
  mediaType: 'image' | 'video'
  url: string
}

export interface NewsItem {
  id: number
  channel: Channel
  text: string
  timestamp: string
}

export interface Cluster {
  id: number
  createdAt: string
  updatedAt: string
  headline: string | null
  summary: string | null
  category: string | null
  countries: string[]
  actors: string[]
  score: number
  channelCount: number
  isProcessed: boolean
  media: Media[]
}

export interface ClusterDetail extends Cluster {
  items: NewsItem[]
}

export type Category =
  | 'conflict'
  | 'political'
  | 'economic'
  | 'humanitarian'
  | 'diplomatic'
  | 'social'
  | 'other'

export interface Filters {
  minScore: number
  country: string
  actor: string
  category: string
}

export interface SSEMessage {
  type: 'connected' | 'cluster_created' | 'cluster_updated'
  data?: Cluster
}
