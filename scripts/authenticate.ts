/**
 * One-time Telegram authentication helper.
 *
 * Run with:  npm run auth
 *
 * It will prompt for your phone number and the code Telegram sends you,
 * then print a TELEGRAM_SESSION_STRING you can paste into your .env file.
 * After that, the server can start without any interactive input.
 */
import * as readline from 'readline/promises'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

async function prompt(question: string): Promise<string> {
  const answer = await rl.question(question)
  return answer.trim()
}

async function main() {
  const apiIdStr  = await prompt('TELEGRAM_API_ID (from https://my.telegram.org): ')
  const apiHash   = await prompt('TELEGRAM_API_HASH: ')
  const apiId     = parseInt(apiIdStr)

  if (!apiId || !apiHash) {
    console.error('API ID and hash are required.')
    process.exit(1)
  }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  })

  await client.start({
    phoneNumber:  () => prompt('Phone number (with country code, e.g. +441234567890): '),
    phoneCode:    () => prompt('Code Telegram sent you: '),
    password:     () => prompt('2FA password (press Enter to skip): '),
    onError: (err) => console.error('Auth error:', err),
  })

  const sessionString = String(client.session.save())

  console.log('\n✅  Authentication successful!\n')
  console.log('Add this to your .env file:\n')
  console.log(`TELEGRAM_SESSION_STRING=${sessionString}`)
  console.log('\n(Keep this secret — it grants full access to your Telegram account.)\n')

  await client.disconnect()
  rl.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
