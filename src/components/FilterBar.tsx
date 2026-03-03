'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { CATEGORY_STYLES } from '@/lib/utils'

const CATEGORIES = ['conflict', 'political', 'economic', 'humanitarian', 'diplomatic', 'social', 'other']

export function FilterBar() {
  const { filters, setFilter, clearFilters, allCountries, allActors } = useApp()
  const [expanded, setExpanded] = useState(false)

  const hasActiveFilters =
    filters.minScore > 0 || filters.country || filters.actor || filters.category

  return (
    <div className="bg-gray-950/95 backdrop-blur border-b border-gray-800 sticky top-14 z-20">
      {/* Category tab strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-hide">
        <button
          onClick={() => setFilter('category', '')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !filters.category
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => {
          const style = CATEGORY_STYLES[cat]
          const active = filters.category === cat
          return (
            <button
              key={cat}
              onClick={() => setFilter('category', active ? '' : cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active ? style.classes : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:text-gray-200'
              }`}
            >
              {style.label}
            </button>
          )
        })}

        {/* Advanced filters toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className={`flex-shrink-0 ml-auto px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            expanded || hasActiveFilters
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-600/40'
              : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:text-gray-200'
          }`}
        >
          Filters {hasActiveFilters ? '●' : ''}
        </button>
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-800/60 pt-3 animate-fade-in">
          {/* Min score */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">
              Min score: <span className="text-indigo-400 font-medium">{filters.minScore}</span>
            </label>
            <input
              type="range"
              min={0} max={100} step={5}
              value={filters.minScore}
              onChange={e => setFilter('minScore', Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Country / Territory</label>
            <select
              value={filters.country}
              onChange={e => setFilter('country', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All</option>
              {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Actor */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Actor / Organisation</label>
            <select
              value={filters.actor}
              onChange={e => setFilter('actor', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All</option>
              {allActors.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Active filter chips + clear */}
          {hasActiveFilters && (
            <div className="sm:col-span-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Active:</span>
              {filters.category && (
                <button
                  onClick={() => setFilter('category', '')}
                  className="chip bg-indigo-900/40 text-indigo-300 border-indigo-700/40 hover:bg-red-900/40 hover:text-red-300 hover:border-red-700/40 transition-colors"
                >
                  {filters.category} ✕
                </button>
              )}
              {filters.country && (
                <button onClick={() => setFilter('country', '')} className="chip bg-gray-700 text-gray-300 border-gray-600 hover:bg-red-900/40 hover:text-red-300 hover:border-red-700/40 transition-colors">
                  {filters.country} ✕
                </button>
              )}
              {filters.actor && (
                <button onClick={() => setFilter('actor', '')} className="chip bg-gray-700 text-gray-300 border-gray-600 hover:bg-red-900/40 hover:text-red-300 hover:border-red-700/40 transition-colors">
                  {filters.actor} ✕
                </button>
              )}
              {filters.minScore > 0 && (
                <button onClick={() => setFilter('minScore', 0)} className="chip bg-gray-700 text-gray-300 border-gray-600 hover:bg-red-900/40 hover:text-red-300 hover:border-red-700/40 transition-colors">
                  Score ≥{filters.minScore} ✕
                </button>
              )}
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 ml-auto">
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
