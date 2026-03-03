export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400 ring-green-500'
  if (score >= 60) return 'text-blue-400 ring-blue-500'
  if (score >= 30) return 'text-amber-400 ring-amber-500'
  return 'text-red-400 ring-red-500'
}

export const CATEGORY_STYLES: Record<string, { label: string; classes: string }> = {
  conflict:     { label: 'Conflict',     classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
  political:    { label: 'Political',    classes: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  economic:     { label: 'Economic',     classes: 'bg-green-500/20 text-green-400 border-green-500/30' },
  humanitarian: { label: 'Humanitarian', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  diplomatic:   { label: 'Diplomatic',   classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  social:       { label: 'Social',       classes: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  other:        { label: 'Other',        classes: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}
