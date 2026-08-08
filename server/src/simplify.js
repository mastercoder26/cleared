import Anthropic from '@anthropic-ai/sdk'
import { config, isClaudeConfigured } from './config.js'

const client = isClaudeConfigured() ? new Anthropic({ apiKey: config.anthropicKey }) : null

const MODEL = 'claude-opus-5'

const SYSTEM_PROMPT = `You rewrite Google Classroom assignments for students with dyslexia, ADHD, and other processing differences.

Your reader is a real student who opens Classroom, sees a wall of teacher text, and cannot find where to start. You produce two things: a stripped-down plain-language version of what the task actually is, and a short sequence of concrete first-person steps.

Rules for the plain version:
- One sentence for "what to do". Start with a verb. No preamble, no restating the assignment title.
- Plain words. Replace academic verbs with what they physically mean: "analyze the themes" becomes "find the big ideas and explain them", "synthesize" becomes "put ideas together", "evaluate" becomes "decide how good it is and say why".
- Say what to hand in and roughly how long it should be, only if the assignment states it. Never invent a length, a format, or a due date.

Rules for the steps:
- 3 to 6 steps. Each is something the student physically does in one sitting: open a file, read a section, write a paragraph, check a box.
- Write them in the imperative, addressed to the student. No step is "understand the topic" or "think about it" — that is not a doable action.
- The first step must be small enough to start in under two minutes. Getting unstuck at the start is the whole point.
- Give a realistic minutes estimate per step. Round to 5, 10, 15, 20, 30, 45, or 60.

Rules for materials: list only files, links, or videos the assignment actually attaches or names. If none, return an empty list.

Never add requirements the teacher did not write. If the assignment is vague about something, say so in "watchOut" rather than filling the gap with a guess. Keep every string short enough to read on a phone.`

/** The exact shape the UI renders. Enforced with structured outputs, so no parsing guesswork. */
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    plain: {
      type: 'object',
      properties: {
        whatToDo: { type: 'string', description: 'One imperative sentence. The real task.' },
        handIn: { type: 'string', description: 'What the student submits. Empty string if not stated.' },
        why: { type: 'string', description: 'One short sentence on why this is assigned. Empty string if unclear.' },
        watchOut: {
          type: 'string',
          description: 'One thing that is easy to miss or that the assignment leaves vague. Empty string if nothing stands out.',
        },
      },
      required: ['whatToDo', 'handIn', 'why', 'watchOut'],
      additionalProperties: false,
    },
    steps: {
      type: 'array',
      description: '3 to 6 concrete actions in order.',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Imperative, one line, something you physically do.' },
          detail: { type: 'string', description: 'One short clarifying line. Empty string if the action is self-explanatory.' },
          minutes: { type: 'integer', description: 'Realistic estimate: 5, 10, 15, 20, 30, 45, or 60.' },
        },
        required: ['action', 'detail', 'minutes'],
        additionalProperties: false,
      },
    },
    materials: {
      type: 'array',
      description: 'Things the student needs, drawn only from the assignment.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          note: { type: 'string', description: 'What it is for. Empty string if obvious.' },
        },
        required: ['label', 'note'],
        additionalProperties: false,
      },
    },
    effort: {
      type: 'string',
      enum: ['quick', 'medium', 'long'],
      description: 'quick = under 30 min total, medium = 30-90 min, long = over 90 min or multi-day.',
    },
  },
  required: ['plain', 'steps', 'materials', 'effort'],
  additionalProperties: false,
}

function buildUserMessage(assignment, course) {
  const parts = [
    `Class: ${course?.name ?? 'Unknown class'}`,
    `Assignment title: ${assignment.title}`,
    assignment.dueAt ? `Due (UTC ISO): ${assignment.dueAt}` : 'Due: not set',
    assignment.maxPoints ? `Points: ${assignment.maxPoints}` : null,
    '',
    'Teacher instructions, verbatim:',
    assignment.description?.trim() || '(The teacher left the description blank.)',
  ]

  if (assignment.materials?.length) {
    parts.push(
      '',
      'Attached materials:',
      ...assignment.materials.map((m) => `- [${m.kind}] ${m.title}`),
    )
  }
  return parts.filter(Boolean).join('\n')
}

/**
 * Rewrite one assignment. Throws with a user-safe message on failure — the
 * route handler decides whether to fall back to the un-simplified text.
 */
export async function simplifyAssignment(assignment, course) {
  if (!client) throw new Error('Claude is not configured on this server.')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    messages: [{ role: 'user', content: buildUserMessage(assignment, course) }],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to rewrite this assignment.')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The rewrite was cut short. Try again.')
  }

  const text = response.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('Claude returned an empty response.')

  return JSON.parse(text)
}
