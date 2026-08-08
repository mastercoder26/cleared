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

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status)
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
