/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * Used to initialise the Telegram client before any request is handled.
 */
export async function register() {
  // Only run in the Node.js runtime (not the Edge runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  if (process.env.TELEGRAM_API_ID) {
    const { initializeTelegram } = await import('./lib/telegram')
    await initializeTelegram()
  }
}
