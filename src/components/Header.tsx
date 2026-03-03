'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export function Header() {
  const { sseConnected } = useApp()
  const pathname = usePathname()
  const isAdmin = pathname === '/admin'

  return (
    <header className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg font-bold text-gray-100 group-hover:text-indigo-300 transition-colors">
              News Aggregator
            </span>
          </Link>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5" title={sseConnected ? 'Live' : 'Reconnecting…'}>
            <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 hidden sm:inline">
              {sseConnected ? 'Live' : 'Reconnecting'}
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {isAdmin ? (
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              ← Feed
            </Link>
          ) : (
            <Link
              href="/admin"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              ⚙ Channels
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
