'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Channel } from '@/lib/types'

export function ChannelManager() {
  const [channels,    setChannels]    = useState<Channel[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [error,       setError]       = useState('')
  const [addForm,     setAddForm]     = useState({
    telegramUsername: '', name: '', reliability: 5, language: 'ar',
  })
  const [addError,    setAddError]    = useState('')
  const [isAdding,    setIsAdding]    = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/channels')
      setChannels(await res.json())
    } catch { setError('Failed to load channels') }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!addForm.telegramUsername || !addForm.name) {
      setAddError('Username and display name are required')
      return
    }
    setIsAdding(true)
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) {
        const d = await res.json()
        setAddError(d.error ?? 'Failed to add channel')
        return
      }
      setAddForm({ telegramUsername: '', name: '', reliability: 5, language: 'ar' })
      await load()
    } finally { setIsAdding(false) }
  }

  const updateChannel = async (id: number, patch: Partial<Channel>) => {
    await fetch(`/api/channels/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  const deleteChannel = async (id: number) => {
    if (!confirm('Remove this channel?')) return
    await fetch(`/api/channels/${id}`, { method: 'DELETE' })
    setChannels(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-6">

      {/* Add channel form */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Add Channel</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Telegram Username</label>
            <input
              placeholder="@ArabNewsChannel"
              value={addForm.telegramUsername}
              onChange={e => setAddForm(f => ({ ...f, telegramUsername: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Display Name</label>
            <input
              placeholder="Arab News Channel"
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Reliability: <span className="text-indigo-400 font-medium">{addForm.reliability}</span> / 10
            </label>
            <input
              type="range" min={1} max={10} step={0.5}
              value={addForm.reliability}
              onChange={e => setAddForm(f => ({ ...f, reliability: Number(e.target.value) }))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Primary Language</label>
            <select
              value={addForm.language}
              onChange={e => setAddForm(f => ({ ...f, language: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="he">Hebrew</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            {addError && <p className="text-sm text-red-400 mb-2">{addError}</p>}
            <button
              type="submit"
              disabled={isAdding}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isAdding ? 'Adding…' : 'Add Channel'}
            </button>
          </div>
        </form>
      </section>

      {/* Channel list */}
      <section>
        <h2 className="text-base font-semibold text-gray-100 mb-3">
          Configured Channels {!isLoading && `(${channels.length})`}
        </h2>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map(ch => (
              <div
                key={ch.id}
                className={`bg-gray-900 border rounded-xl p-4 ${ch.isActive ? 'border-gray-800' : 'border-gray-800 opacity-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-100 truncate">{ch.name}</p>
                    <p className="text-sm text-gray-500">@{ch.telegramUsername}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Active toggle */}
                    <button
                      onClick={() => updateChannel(ch.id, { isActive: !ch.isActive })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${ch.isActive ? 'bg-indigo-600' : 'bg-gray-700'}`}
                      title={ch.isActive ? 'Disable' : 'Enable'}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${ch.isActive ? 'translate-x-5' : ''}`}
                      />
                    </button>

                    <button
                      onClick={() => deleteChannel(ch.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Reliability slider */}
                <div className="mt-3">
                  <label className="text-xs text-gray-500">
                    Reliability: <span className="text-indigo-400 font-medium">{ch.reliability.toFixed(1)}</span> / 10
                  </label>
                  <input
                    type="range" min={1} max={10} step={0.5}
                    value={ch.reliability}
                    onChange={e => updateChannel(ch.id, { reliability: Number(e.target.value) })}
                    className="w-full mt-1 accent-indigo-500"
                  />
                </div>
              </div>
            ))}

            {channels.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No channels configured yet.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
