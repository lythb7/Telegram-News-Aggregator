/**
 * Server-Sent Events endpoint.
 * The client connects once and receives cluster_created / cluster_updated events.
 */
import { subscribe } from '@/lib/broadcaster'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const encoder = new TextEncoder()

  let unsubscribe: (() => void) | undefined

  const stream = new ReadableStream({
    start(controller) {
      // Confirm connection
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      unsubscribe = subscribe(event => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          unsubscribe?.()
        }
      })

      // Clean up when the client disconnects
      request.signal.addEventListener('abort', () => {
        unsubscribe?.()
        try { controller.close() } catch {}
      })
    },
    cancel() {
      unsubscribe?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',  // disable nginx buffering
    },
  })
}
