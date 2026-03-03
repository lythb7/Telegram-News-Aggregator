'use client'

import { useState } from 'react'
import type { Media } from '@/lib/types'

export function MediaGallery({ media }: { media: Media[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!media.length) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {media.map(m => (
          <div key={m.id} className="relative group">
            {m.mediaType === 'image' ? (
              <button
                onClick={() => setLightbox(m.url)}
                className="block w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt="news media"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ) : (
              <video
                src={m.url}
                controls
                className="w-48 sm:w-64 rounded-lg border border-gray-700"
                preload="metadata"
              />
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="enlarged"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
