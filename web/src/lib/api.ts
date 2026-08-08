import type { Course, CourseWork, Me, Rewrite } from './types'

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
}

export { ApiError }
