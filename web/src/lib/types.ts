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
