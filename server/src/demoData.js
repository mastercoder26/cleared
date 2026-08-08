/**
 * Demo mode. Real Classroom text is dense, unstructured, and buries the task —
 * these samples are written to match that, so the rewrite is exercised honestly.
 * Used when Google OAuth is not configured, or when a user picks "Try the demo".
 */

const daysFromNow = (days, hour = 23, minute = 59) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  d.setUTCHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const DEMO_USER = { name: 'Demo student', email: 'demo@cleared.app', picture: null }

export const DEMO_COURSES = [
  { id: 'demo-eng', name: 'English 10', section: 'Period 3', room: 'B204', teacherFolderLink: null },
  { id: 'demo-bio', name: 'Biology', section: 'Period 5', room: 'Lab 2', teacherFolderLink: null },
  { id: 'demo-hist', name: 'US History', section: 'Period 1', room: 'A115', teacherFolderLink: null },
]

export const DEMO_COURSEWORK = {
  'demo-eng': [
    {
      id: 'demo-eng-1',
      courseId: 'demo-eng',
      title: 'Of Mice and Men — Thematic Analysis Response',
      description: `As we wrap up our unit, I want you to analyze the themes we've been discussing in class and consider how Steinbeck develops them across the novella. Remember our discussion Tuesday about the difference between a topic and a theme — a topic is one word, a theme is a claim about the world. Your response should demonstrate close reading and engage meaningfully with the text rather than summarizing plot. Please make sure you are using textual evidence to support your interpretation, and that you are analyzing that evidence rather than just dropping quotes in. MLA format, 12pt Times New Roman, double spaced. Aim for roughly 500-750 words. I've attached the graphic organizer from Monday if that helps you plan, and the MLA citation guide is linked below. Late work is accepted but capped at 80%. Reach out if you're stuck — office hours are Thursday during lunch.`,
      workType: 'ASSIGNMENT',
      maxPoints: 100,
      dueAt: daysFromNow(3),
      link: null,
      createdAt: daysFromNow(-4),
      submissionState: 'NEW',
      materials: [
        { kind: 'file', title: 'Theme Graphic Organizer.docx', url: '#' },
        { kind: 'link', title: 'Purdue OWL — MLA Formatting', url: 'https://owl.purdue.edu' },
      ],
    },
    {
      id: 'demo-eng-2',
      courseId: 'demo-eng',
      title: 'Vocabulary Unit 7 Quiz Prep',
      description: `Quiz Friday on Unit 7 words. Review the list, know definitions AND be able to use each word in a sentence correctly. The quiz will have matching, fill in the blank, and two short constructed responses.`,
      workType: 'ASSIGNMENT',
      maxPoints: 20,
      dueAt: daysFromNow(1, 15, 30),
      link: null,
      createdAt: daysFromNow(-2),
      submissionState: 'NEW',
      materials: [{ kind: 'file', title: 'Unit 7 Word List.pdf', url: '#' }],
    },
  ],
  'demo-bio': [
    {
      id: 'demo-bio-1',
      courseId: 'demo-bio',
      title: 'Cell Respiration Lab Write-Up',
      description: `Complete the full lab report for the yeast fermentation lab we ran Wednesday. Follow the standard format we've been using all semester: purpose, hypothesis, materials, procedure, data table, graph, analysis, conclusion. Your graph must be made in Sheets, not hand drawn, and needs axis labels with units and a title. In the analysis section address whether your results supported your hypothesis and identify at least two sources of error — and I mean real sources of error, not "human error." The conclusion should connect back to the aerobic vs anaerobic respiration pathways from the notes. Data from your group is fine but the write-up must be your own words.`,
      workType: 'ASSIGNMENT',
      maxPoints: 50,
      dueAt: daysFromNow(5),
      link: null,
      createdAt: daysFromNow(-1),
      submissionState: 'NEW',
      materials: [
        { kind: 'file', title: 'Lab Report Template.gdoc', url: '#' },
        { kind: 'video', title: 'Cellular Respiration Review', url: '#' },
      ],
    },
  ],
  'demo-hist': [
    {
      id: 'demo-hist-1',
      courseId: 'demo-hist',
      title: 'DBQ Practice — Industrialization',
      description: `Using the seven documents provided, construct an argument that evaluates the extent to which industrialization transformed American society between 1865 and 1900. You must contextualize, develop a defensible thesis, use at least six documents as evidence, source at least three documents (HIPP), and incorporate one piece of outside evidence. This is timed practice — give yourself 60 minutes once you start.`,
      workType: 'ASSIGNMENT',
      maxPoints: 7,
      dueAt: daysFromNow(8),
      link: null,
      createdAt: daysFromNow(-3),
      submissionState: 'NEW',
      materials: [{ kind: 'file', title: 'DBQ Document Packet.pdf', url: '#' }],
    },
    {
      id: 'demo-hist-2',
      courseId: 'demo-hist',
      title: 'Chapter 18 Reading Notes',
      description: `Read pages 412-438 and take Cornell notes. Turned in at the start of class.`,
      workType: 'ASSIGNMENT',
      maxPoints: 10,
      dueAt: daysFromNow(-1),
      link: null,
      createdAt: daysFromNow(-6),
      submissionState: 'TURNED_IN',
      materials: [],
    },
  ],
}

export const demoCourseWork = (courseId) => DEMO_COURSEWORK[courseId] ?? []

export const findDemoCourseWork = (courseId, courseWorkId) =>
  demoCourseWork(courseId).find((w) => w.id === courseWorkId) ?? null
