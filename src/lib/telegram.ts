/**
 * Telegram MTProto client using GramJS.
 * Initialised once via src/instrumentation.ts when the Next.js server starts.
 * Listens to all chats the user account is in, then filters to configured channels.
 */
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { NewMessage, NewMessageEvent } from 'telegram/events'
import { Api } from 'telegram'
import path from 'path'
import fs from 'fs'
import { prisma } from './db'
import { processMessage } from './processor'

// ── Singleton ──────────────────────────────────────────────────────────────

const g = globalThis as unknown as { _tgClient?: TelegramClient }

export function getClient(): TelegramClient | undefined {
  return g._tgClient
}

// ── Startup ────────────────────────────────────────────────────────────────

export async function initializeTelegram() {
  const apiId   = parseInt(process.env.TELEGRAM_API_ID   ?? '0')
  const apiHash = process.env.TELEGRAM_API_HASH           ?? ''
  const session = process.env.TELEGRAM_SESSION_STRING     ?? ''

  if (!apiId || !apiHash) {
    console.warn('[telegram] TELEGRAM_API_ID / TELEGRAM_API_HASH not set — client disabled')
    return
  }

  if (g._tgClient?.connected) return

  try {
    const client = new TelegramClient(
      new StringSession(session),
      apiId,
      apiHash,
      { connectionRetries: 5, retryDelay: 1000, autoReconnect: true },
    )

    await client.connect()
    console.log('[telegram] Connected')
    g._tgClient = client

    // Listen to ALL new messages; filter by active channels inside the handler.
    // This avoids needing to re-register handlers when channels are added.
    client.addEventHandler(
      (event: NewMessageEvent) => handleMessage(client, event).catch(console.error),
      new NewMessage({}),
    )
  } catch (e) {
    console.error('[telegram] Failed to connect:', e)
  }
}

// ── Message handler ────────────────────────────────────────────────────────

async function handleMessage(client: TelegramClient, event: NewMessageEvent) {
  const msg  = event.message
  const text = (msg as any).text ?? (msg as any).message ?? ''
  if (!text.trim()) return

  // Identify the source chat
  const chat     = await event.getChat()
  const username = (chat as any).username as string | undefined
  if (!username) return  // skip private messages, groups without username

  // Check if this channel is actively monitored
  const channel = await prisma.channel.findUnique({
    where: { telegramUsername: username, isActive: true },
  })
  if (!channel) return

  // Download media (non-blocking — errors are swallowed)
  const mediaPaths = await downloadMedia(client, msg, username)

  await processMessage({
    channelUsername: username,
    messageId:       (msg as any).id as number,
    text,
    timestamp:       new Date(((msg as any).date as number) * 1000),
    mediaPaths,
  })
}

// ── Media download ─────────────────────────────────────────────────────────

async function downloadMedia(
  client: TelegramClient,
  msg: any,
  channelUsername: string,
): Promise<Array<{ filePath: string; mediaType: string }>> {
  const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads')
  fs.mkdirSync(uploadsDir, { recursive: true })

  const results: Array<{ filePath: string; mediaType: string }> = []
  if (!msg.media) return results

  try {
    const media = msg.media

    if (media instanceof Api.MessageMediaPhoto) {
      const filePath = path.join(uploadsDir, `${channelUsername}_${msg.id}.jpg`)
      const buffer   = await client.downloadMedia(msg, {}) as Buffer | null
      if (buffer) {
        fs.writeFileSync(filePath, buffer)
        results.push({ filePath, mediaType: 'image' })
      }
    } else if (media instanceof Api.MessageMediaDocument) {
      const doc  = media.document as Api.Document | undefined
      if (!doc) return results

      const mime    = doc.mimeType ?? ''
      const sizeMb  = Number(doc.size) / 1024 / 1024
      const maxSize = parseInt(process.env.MAX_MEDIA_SIZE_MB ?? '50')

      if (sizeMb > maxSize) return results

      let mediaType: string
      let ext: string

      if (mime.startsWith('image/')) { mediaType = 'image'; ext = 'jpg' }
      else if (mime.startsWith('video/')) { mediaType = 'video'; ext = 'mp4' }
      else return results

      const filePath = path.join(uploadsDir, `${channelUsername}_${msg.id}.${ext}`)
      const buffer   = await client.downloadMedia(msg, {}) as Buffer | null
      if (buffer) {
        fs.writeFileSync(filePath, buffer)
        results.push({ filePath, mediaType })
      }
    }
  } catch (e) {
    console.warn('[telegram] Media download failed:', e)
  }

  return results
}
