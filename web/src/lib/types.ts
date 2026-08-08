export interface Course {
  id: string
  name: string
  section: string | null
  room: string | null
  teacherFolderLink: string | null
}

export type SubmissionState =
  | 'NEW'
  | 'CREATED'
  | 'TURNED_IN'
  | 'RETURNED'
  | 'RECLAIMED_BY_STUDENT'

export interface Material {
  kind: 'file' | 'video' | 'link' | 'form'
  title: string
  url: string | null
}

export interface CourseWork {
  id: string
  courseId: string
  title: string
  description: string
  workType: string
  maxPoints: number | null
  dueAt: string | null
  link: string | null
  createdAt: string | null
  submissionState: SubmissionState
  materials: Material[]
}

export interface RewriteStep {
  action: string
  detail: string
  minutes: number
}

export interface RewriteMaterial {
  label: string
  note: string
}

export interface Rewrite {
  plain: {
    whatToDo: string
    handIn: string
    why: string
    watchOut: string
  }
  steps: RewriteStep[]
  materials: RewriteMaterial[]
  effort: 'quick' | 'medium' | 'long'
}

export interface Me {
  user: { name: string; email: string; picture: string | null } | null
  demo: boolean
  googleConfigured: boolean
  claudeConfigured: boolean
}

export interface TodoItem extends CourseWork {
  courseName: string
}

export type SummaryTone = 'plain' | 'encouraging' | 'brief'

export interface DailySummary {
  headline: string
  highlights: string[]
  note: string
}

/* ------------------------------------------------------------------ progress
   Where a student actually is on a piece of work. This is cleared's own
   state — it is never written back to Google Classroom. */

export type WorkStatus = 'not-started' | 'in-progress' | 'stuck' | 'done'

export interface WorkProgress {
  workId: string
  courseId: string
  status: WorkStatus
  /** Indexes into the rewrite's `steps` array that have been checked off. */
  completedSteps: number[]
  /** Total focused time logged against this assignment. */
  secondsSpent: number
  /** The student's own scratch notes. Free text, never sent anywhere. */
  notes: string
  startedAt: string | null
  updatedAt: string
}

export type ProgressMap = Record<string, WorkProgress>

/* ------------------------------------------------------------------- unstick
   The "I'm stuck" helper. Deliberately gives unblocking moves, never the
   answer to the assignment itself. */

export interface UnstickHelp {
  /** The step restated in different words — often enough on its own. */
  reframe: string
  /** 2-4 concrete things to try right now. */
  nudges: string[]
  /** The single smallest physical action that breaks the freeze. */
  smallestNextAction: string
  /** One short, non-saccharine line. */
  encouragement: string
}

export type StuckFeeling = 'dont-understand' | 'too-big' | 'cant-start' | 'lost-interest'

/* ---------------------------------------------------------------------- plan
   Backward planning from a due date. The antidote to time blindness: not
   "this is due Friday" but "start Wednesday, here's the first sitting". */

export interface PlanSession {
  /** YYYY-MM-DD. */
  date: string
  /** Human label, e.g. "Wednesday after school". */
  label: string
  minutes: number
  goal: string
  /** Which rewrite steps this sitting covers. */
  stepIndexes: number[]
}

export interface WorkPlan {
  /** YYYY-MM-DD — the day to begin if you want to finish without a panic. */
  startBy: string
  totalMinutes: number
  sessions: PlanSession[]
  rationale: string
}

/* ------------------------------------------------------------------ workload
   Computed server-side with no model call — pure arithmetic over due dates. */

export type LoadLevel = 'clear' | 'light' | 'busy' | 'heavy'

export interface WorkloadItem {
  id: string
  courseId: string
  courseName: string
  title: string
  dueAt: string | null
  estimatedMinutes: number
}

export interface WorkloadDay {
  /** YYYY-MM-DD. */
  date: string
  dueCount: number
  estimatedMinutes: number
  load: LoadLevel
  items: WorkloadItem[]
}
