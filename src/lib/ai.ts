import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001'

// ── Prompts ────────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `\
You are analyzing a news message from a Telegram channel focused on Middle East news.
The message may be in Arabic, English, or a mix of both.

Extract the following and respond ONLY with valid JSON — no markdown, no explanation:
{
  "is_news": true or false,
  "headline": "Brief English headline (10–15 words)",
  "summary": "2–3 sentence English summary of the event",
  "countries": ["countries or territories mentioned, e.g. Gaza, Lebanon, Israel, Syria, West Bank, Yemen"],
  "actors": ["organizations, groups, or named individuals, e.g. IDF, Hamas, Hezbollah, UN, UNRWA, Houthis"],
  "category": "one of: conflict, political, economic, humanitarian, diplomatic, social, other"
}

Set is_news to false if the message is an advertisement, channel announcement, media caption without news context, or is not reporting an event.

Message:
{text}`

const UPDATE_PROMPT = `\
You are updating a running news story summary as more channel reports arrive.

All reports received so far (oldest first):
{reports}

Current summary: {current_summary}

Provide an updated, comprehensive summary incorporating all reports.
Respond ONLY with valid JSON — no markdown, no explanation:
{
  "headline": "Brief English headline (10–15 words)",
  "summary": "2–4 sentence English summary incorporating all perspectives",
  "countries": ["complete deduplicated list of countries/territories"],
  "actors": ["complete deduplicated list of organizations/groups/individuals"]
}`

// ── Client singleton ───────────────────────────────────────────────────────

let _client: Anthropic | null = null

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  _client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

// ── Exports ────────────────────────────────────────────────────────────────

export interface ExtractionResult {
  is_news: boolean
  headline: string
  summary: string
  countries: string[]
  actors: string[]
  category: string
}

export async function extractEntities(text: string): Promise<ExtractionResult | null> {
  const ai = client()
  if (!ai) return null
  try {
    const res = await ai.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: EXTRACTION_PROMPT.replace('{text}', text.slice(0, 3000)) }],
    })
    return JSON.parse((res.content[0] as { text: string }).text.trim())
  } catch (e) {
    console.warn('[ai] extractEntities failed:', e)
    return null
  }
}

export interface UpdateResult {
  headline: string
  summary: string
  countries: string[]
  actors: string[]
}

export async function updateClusterSummary(
  reports: string[],
  currentSummary: string,
): Promise<UpdateResult | null> {
  const ai = client()
  if (!ai) return null
  try {
    const reportsText = reports
      .map((r, i) => `Report ${i + 1}: ${r.slice(0, 800)}`)
      .join('\n---\n')
    const res = await ai.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: UPDATE_PROMPT
          .replace('{reports}', reportsText)
          .replace('{current_summary}', currentSummary || '(none yet)'),
      }],
    })
    return JSON.parse((res.content[0] as { text: string }).text.trim())
  } catch (e) {
    console.warn('[ai] updateClusterSummary failed:', e)
    return null
  }
}
