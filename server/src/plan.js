import Anthropic from '@anthropic-ai/sdk'
import { config, isClaudeConfigured } from './config.js'

const client = isClaudeConfigured() ? new Anthropic({ apiKey: config.anthropicKey }) : null
const MODEL = 'claude-opus-5'

const MIN_SESSION_MINUTES = 20
const MAX_SESSION_MINUTES = 45

// Addresses time blindness: the point isn't "it's due Friday", it's "start
// Wednesday, and here's what Wednesday looks like."
const SYSTEM_PROMPT = `You build a backward plan from a due date for a student with ADHD or dyslexia. The point is to fight time blindness: instead of "it's due Friday", say exactly when to start and what each sitting looks like.

Rules:
- Sessions are ${MIN_SESSION_MINUTES}-${MAX_SESSION_MINUTES} minutes. Never longer — long blocks don't get started. If the total work is bigger than one session, split it across multiple sessions rather than lengthening one.
- Never schedule a session on a date before today, and never on or after the due date itself — leave at least one full day of buffer before it's due.
- If the whole assignment realistically fits in one sitting, say so and return a single session. Don't invent extra sessions to look thorough.
- label should read like a human said it: "Thursday evening", "Tuesday after school" — not "Session 1".
- stepIndexes should reference the rewrite step indexes (0-based) each session is meant to cover, based on the steps and minute estimates given to you.
- rationale is one or two sentences explaining why you chose this start date and buffer, grounded in the actual due date and workload.
- Never invent a due date, requirement, or step that wasn't given to you.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    startBy: { type: 'string', description: 'YYYY-MM-DD, the day to begin.' },
    totalMinutes: { type: 'integer', description: 'Sum of all session minutes.' },
    sessions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
          label: { type: 'string', description: 'Human label, e.g. "Thursday evening".' },
          minutes: { type: 'integer' },
          goal: { type: 'string', description: 'What gets done in this sitting.' },
          stepIndexes: { type: 'array', items: { type: 'integer' } },
        },
        required: ['date', 'label', 'minutes', 'goal', 'stepIndexes'],
        additionalProperties: false,
      },
    },
    rationale: { type: 'string' },
  },
  required: ['startBy', 'totalMinutes', 'sessions', 'rationale'],
  additionalProperties: false,
}

function buildUserMessage({ assignment, course, steps }) {
  const stepLines = steps.length
    ? steps.map((s, i) => `${i}. ${s.action} (~${s.minutes} min)`).join('\n')
    : '(No step breakdown available — plan from the assignment description alone.)'

  return [
    `Today's date: ${new Date().toISOString().slice(0, 10)}`,
    `Class: ${course?.name ?? 'Unknown class'}`,
    `Assignment: ${assignment.title}`,
    assignment.dueAt ? `Due: ${assignment.dueAt}` : 'Due: not set — treat as flexible, plan starting soon.',
    '',
    'Step breakdown with time estimates:',
    stepLines,
  ].join('\n')
}

/**
 * Builds a backward plan. Callers that already have the rewrite's steps
 * should pass them in `steps` to avoid a duplicate model call; otherwise
 * pass an empty array and the model plans from the description alone.
 */
export async function buildPlan({ assignment, course, steps = [] }) {
  if (!client) throw new Error('Claude is not configured on this server.')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    messages: [{ role: 'user', content: buildUserMessage({ assignment, course, steps }) }],
  })

  if (response.stop_reason === 'refusal') throw new Error('Claude declined to build a plan.')
  if (response.stop_reason === 'max_tokens') throw new Error('The plan was cut short. Try again.')

  const text = response.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('Claude returned an empty response.')
  return JSON.parse(text)
}
