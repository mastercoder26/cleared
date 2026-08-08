import Anthropic from '@anthropic-ai/sdk'
import { config, isClaudeConfigured } from './config.js'

const client = isClaudeConfigured() ? new Anthropic({ apiKey: config.anthropicKey }) : null
const MODEL = 'claude-opus-5'

const TONE_GUIDANCE = {
  plain: 'Neutral and matter-of-fact. State what is due, nothing more.',
  encouraging: 'Warm and supportive, like a friend checking in. Never saccharine or over the top.',
  brief: 'As short as possible. Fragments over full sentences where that still reads clearly.',
}

const SYSTEM_PROMPT = `You write a short daily briefing for a student with ADHD or dyslexia opening their assignment tracker for the day. Your job is orientation, not motivation-speak: tell them exactly where they stand before they open anything else.

Ground every claim in the list you're given — never invent an assignment, a due date, or a count that isn't in the data.

If nothing is due soon, say that plainly and briefly. Do not manufacture urgency or pad the response to sound more substantial.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description: 'One sentence, said directly to the student, summarizing today at a glance.',
    },
    highlights: {
      type: 'array',
      description: 'Up to 4 short bullet points, most urgent first. Empty array if nothing stands out.',
      items: { type: 'string' },
    },
    note: {
      type: 'string',
      description: 'One optional short sentence of context or encouragement matching the requested tone. Empty string if not needed.',
    },
  },
  required: ['headline', 'highlights', 'note'],
  additionalProperties: false,
}

function buildUserMessage(items, tone) {
  const dueSoon = items.filter((i) => i.dueAt && i.submissionState !== 'TURNED_IN' && i.submissionState !== 'RETURNED')
  const lines = dueSoon.slice(0, 12).map((i) => {
    const hours = (new Date(i.dueAt).getTime() - Date.now()) / 3_600_000
    const when = hours < 0 ? 'OVERDUE' : hours < 24 ? 'due today' : hours < 24 * 4 ? 'due this week' : 'due later'
    return `- [${i.courseName}] "${i.title}" — ${when} (${i.dueAt})`
  })

  return [
    `Today's date/time (UTC): ${new Date().toISOString()}`,
    `Requested tone: ${tone}. ${TONE_GUIDANCE[tone] ?? TONE_GUIDANCE.plain}`,
    '',
    lines.length ? `Outstanding assignments across all classes:\n${lines.join('\n')}` : 'No outstanding assignments with a due date.',
  ].join('\n')
}

export async function generateDailySummary(items, tone) {
  if (!client) throw new Error('Claude is not configured on this server.')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    messages: [{ role: 'user', content: buildUserMessage(items, tone) }],
  })

  if (response.stop_reason === 'refusal') throw new Error('Claude declined to generate a summary.')
  const text = response.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('Claude returned an empty response.')
  return JSON.parse(text)
}
