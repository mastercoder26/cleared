import { listCourses, listCourseWork } from './classroom.js'
import { DEMO_COURSES, demoCourseWork } from './demoData.js'

/**
 * Flattens every course's coursework into one list, soonest due date first.
 * This is the data source for both the Today feed and the daily summary —
 * one aggregation, two views.
 */
export async function buildTodo(session) {
  const courses = session.mode === 'demo' ? DEMO_COURSES : await listCourses(session.accessToken)

  const perCourse = await Promise.all(
    courses.map(async (course) => {
      const items =
        session.mode === 'demo'
          ? demoCourseWork(course.id)
          : await listCourseWork(session.accessToken, course.id)
      return items.map((item) => ({ ...item, courseName: course.name }))
    }),
  )

  const items = perCourse.flat().sort(byDueDateAscending)
  return { courses, items }
}

function byDueDateAscending(a, b) {
  if (!a.dueAt && !b.dueAt) return 0
  if (!a.dueAt) return 1
  if (!b.dueAt) return -1
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
}
