import type {
  Course,
  CourseWork,
  DailySummary,
  Me,
  ProgressMap,
  Rewrite,
  StuckFeeling,
  SummaryTone,
  TodoItem,
  UnstickHelp,
  WorkloadDay,
  WorkPlan,
  WorkProgress,
} from './types'

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8787'

/** Status we use for "the request never reached the server" — distinct from any real HTTP code. */
export const OFFLINE_STATUS = 0

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }

  /** The server was unreachable, as opposed to answering with an error. */
  get isOffline(): boolean {
    return this.status === OFFLINE_STATUS
  }

  /** The route isn't deployed yet or the feature is switched off server-side. */
  get isUnavailable(): boolean {
    return this.status === 404 || this.status === 503
  }
}

/**
 * A session can expire in the middle of any call, on any page. Rather than
 * making every caller handle that, expiry is broadcast once here and the auth
 * provider listens — so the whole app drops to signed-out together instead of
 * leaving one screen showing stale data behind an expired cookie.
 */
export const SESSION_EXPIRED_EVENT = 'cleared:session-expired'

function broadcastSessionExpiry() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    })
  } catch {
    // fetch only rejects on network failure — the server never answered.
    throw new ApiError(
      "Can't reach cleared right now. Check your connection and try again.",
      OFFLINE_STATUS,
    )
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) broadcastSessionExpiry()
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status)
  }
  return body as T
}

export const api = {
  me: () => request<Me>('/api/me'),
  startGoogleSignIn: () => request<{ url: string }>('/api/auth/google'),
  startDemo: () => request<{ user: Me['user']; demo: boolean }>('/api/auth/demo', { method: 'POST' }),
  signOut: () => request<{ ok: true }>('/api/auth/signout', { method: 'POST' }),

  courses: () => request<{ courses: Course[] }>('/api/courses'),
  courseWork: (courseId: string) =>
    request<{ courseWork: CourseWork[] }>(`/api/courses/${courseId}/coursework`),
  oneCourseWork: (courseId: string, workId: string) =>
    request<{ courseWork: CourseWork }>(`/api/courses/${courseId}/coursework/${workId}`),

  simplify: (courseId: string, workId: string, refresh = false) =>
    request<{ rewrite: Rewrite; cached: boolean }>('/api/simplify', {
      method: 'POST',
      body: JSON.stringify({ courseId, workId, refresh }),
    }),

  todo: () => request<{ courses: Course[]; items: TodoItem[] }>('/api/todo'),
  dailySummary: (tone: SummaryTone, refresh = false) =>
    request<{ summary: DailySummary; cached: boolean }>('/api/daily-summary', {
      method: 'POST',
      body: JSON.stringify({ tone, refresh }),
    }),

  progress: () => request<{ progress: ProgressMap }>('/api/progress'),
  saveProgress: (workId: string, patch: Partial<WorkProgress> & { courseId: string }) =>
    request<{ progress: WorkProgress }>(`/api/progress/${workId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  unstick: (input: {
    courseId: string
    workId: string
    stepIndex: number | null
    tried: string
    feeling: StuckFeeling
  }) =>
    request<{ help: UnstickHelp }>('/api/unstick', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  plan: (courseId: string, workId: string, refresh = false) =>
    request<{ plan: WorkPlan; cached: boolean }>('/api/plan', {
      method: 'POST',
      body: JSON.stringify({ courseId, workId, refresh }),
    }),

  workload: (days = 14) => request<{ days: WorkloadDay[] }>(`/api/workload?days=${days}`),
}

export { ApiError }
