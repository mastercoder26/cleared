import { CLASSROOM_API } from './config.js'

async function classroomGet(accessToken, path, params = {}) {
  const url = new URL(CLASSROOM_API + path)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = body?.error?.message ?? `Classroom API error ${res.status}`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return body
}

/** Courses the signed-in student is actively enrolled in. */
export async function listCourses(accessToken) {
  const body = await classroomGet(accessToken, '/courses', {
    studentId: 'me',
    courseStates: 'ACTIVE',
    pageSize: 50,
  })
  return (body.courses ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section ?? null,
    room: c.room ?? null,
    teacherFolderLink: c.alternateLink ?? null,
  }))
}

/**
 * Published coursework for one course, newest first, with the student's own
 * submission state folded in so we can tell "turned in" from "not started".
 */
export async function listCourseWork(accessToken, courseId) {
  const [workBody, subBody] = await Promise.all([
    classroomGet(accessToken, `/courses/${courseId}/courseWork`, {
      courseWorkStates: 'PUBLISHED',
      orderBy: 'dueDate desc',
      pageSize: 40,
    }),
    classroomGet(accessToken, `/courses/${courseId}/courseWork/-/studentSubmissions`, {
      userId: 'me',
      pageSize: 100,
    }).catch(() => ({ studentSubmissions: [] })),
  ])

  const stateByWorkId = new Map(
    (subBody.studentSubmissions ?? []).map((s) => [s.courseWorkId, s.state]),
  )

  return (workBody.courseWork ?? []).map((w) => normalizeCourseWork(w, courseId, stateByWorkId))
}

export async function getCourseWork(accessToken, courseId, courseWorkId) {
  const [work, subBody] = await Promise.all([
    classroomGet(accessToken, `/courses/${courseId}/courseWork/${courseWorkId}`),
    classroomGet(
      accessToken,
      `/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
      { userId: 'me' },
    ).catch(() => ({ studentSubmissions: [] })),
  ])
  const state = subBody.studentSubmissions?.[0]?.state
  return normalizeCourseWork(work, courseId, new Map([[work.id, state]]))
}

function normalizeCourseWork(w, courseId, stateByWorkId) {
  return {
    id: w.id,
    courseId,
    title: w.title,
    description: w.description ?? '',
    workType: w.workType ?? 'ASSIGNMENT',
    maxPoints: w.maxPoints ?? null,
    dueAt: toIsoDue(w.dueDate, w.dueTime),
    link: w.alternateLink ?? null,
    createdAt: w.creationTime ?? null,
    submissionState: stateByWorkId.get(w.id) ?? 'NEW',
    materials: (w.materials ?? []).map(normalizeMaterial).filter(Boolean),
  }
}

/**
 * Classroom returns dueDate/dueTime as separate partial objects in UTC.
 * Missing time fields default to 0, which Classroom treats as end-of-day-ish;
 * we keep it literal and let the UI render "no time set" when hours are absent.
 */
function toIsoDue(dueDate, dueTime) {
  if (!dueDate) return null
  const { year, month, day } = dueDate
  const { hours = 23, minutes = 59 } = dueTime ?? {}
  return new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString()
}

function normalizeMaterial(m) {
  if (m.driveFile?.driveFile) {
    return { kind: 'file', title: m.driveFile.driveFile.title, url: m.driveFile.driveFile.alternateLink }
  }
  if (m.youtubeVideo) {
    return { kind: 'video', title: m.youtubeVideo.title, url: m.youtubeVideo.alternateLink }
  }
  if (m.link) {
    return { kind: 'link', title: m.link.title ?? m.link.url, url: m.link.url }
  }
  if (m.form) {
    return { kind: 'form', title: m.form.title, url: m.form.formUrl }
  }
  return null
}
