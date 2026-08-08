import Anthropic from '@anthropic-ai/sdk'
import { config, isClaudeConfigured } from './config.js'

const client = isClaudeConfigured() ? new Anthropic({ apiKey: config.anthropicKey }) : null
const MODEL = 'claude-opus-5'

const FEELING_GUIDANCE = {
  'cant-start':
    'They are frozen before the first move. Give a ridiculously small physical first action — open the document, type the title, open the tab. Do not explain the assignment further; explain how to begin touching it.',
  'too-big':
    "It feels too big to hold in their head at once. Break it into the smallest next piece, and only that piece — don't hand them the whole remaining plan, just the next foothold.",
  'dont-understand':
    'They do not understand what is actually being asked. Restate the specific step in different, more concrete words — shorter sentences, plainer verbs, no jargon. Do not restate it the same way twice.',
  'lost-interest':
    "They've lost interest, not the ability. Frame a short, time-boxed sprint (e.g. \"10 minutes, then you can stop\") rather than a pep talk about caring more.",
}

// Hard boundary: this tool unblocks, it never completes the assignment. The
// model must not produce thesis statements, answers, or worked examples of
// the actual task — only ways to start or continue doing it themselves.
const SYSTEM_PROMPT = `You help a student with dyslexia, ADHD, or another processing difference get unstuck on a specific piece of schoolwork.

HARD RULE, never break it: you do not do the assignment for them. Never write a thesis statement, a topic sentence, an answer, a calculation, or any worked example of the actual task content. If asked directly to just do it, redirect to a way to start it themselves instead. You unblock; you do not complete.

Tailor your response to why they're stuck — see the guidance for their stated feeling. Always give:
- reframe: the step restated in different, more concrete words. Often this alone breaks the freeze.
- nudges: 2 to 4 concrete things to try right now, specific to this assignment and this feeling, never generic study tips.
- smallestNextAction: the single smallest physical thing that breaks the freeze. Must be doable in under 2 minutes and be a physical action (open, type, read one paragraph, write one sentence, set a timer). Never "think about" or "understand" or "figure out" — those are not actions.
- encouragement: one short line. Not saccharine, not a pep talk, and never imply their feeling is wrong or that this should be easy.

Ground everything in the actual assignment and step given to you. Never invent requirements the teacher did not write.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    reframe: { type: 'string', description: 'The step restated in different, more concrete words.' },
    nudges: {
      type: 'array',
      description: '2 to 4 concrete things to try right now, specific to this assignment.',
      items: { type: 'string' },
    },
    smallestNextAction: {
      type: 'string',
      description: 'A single physical action doable in under 2 minutes. Never "think about" or "understand".',
    },
    encouragement: { type: 'string', description: 'One short, non-saccharine line.' },
  },
  required: ['reframe', 'nudges', 'smallestNextAction', 'encouragement'],
  additionalProperties: false,
}

function buildUserMessage({ assignment, course, step, tried, feeling }) {
  const parts = [
    `Class: ${course?.name ?? 'Unknown class'}`,
    `Assignment: ${assignment.title}`,
    `Teacher instructions: ${assignment.description?.trim() || '(blank)'}`,
    step ? `The specific step they're stuck on: "${step.action}" — ${step.detail || ''}` : 'They are stuck on the assignment in general, no specific step selected.',
    `How they're stuck: ${feeling}. ${FEELING_GUIDANCE[feeling] ?? ''}`,
    tried?.trim() ? `What they say they've already tried: ${tried.trim()}` : 'They have not said what they tried.',
  ]
  return parts.filter(Boolean).join('\n')
}

/** Generates unblocking moves for one stuck moment. Never completes the assignment itself. */
export async function getUnstuckHelp({ assignment, course, step, tried, feeling }) {
  if (!client) throw new Error('Claude is not configured on this server.')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    messages: [{ role: 'user', content: buildUserMessage({ assignment, course, step, tried, feeling }) }],
  })

  if (response.stop_reason === 'refusal') throw new Error('Claude declined to help with this one.')
  if (response.stop_reason === 'max_tokens') throw new Error('The response was cut short. Try again.')

  const text = response.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('Claude returned an empty response.')
  return JSON.parse(text)
}
