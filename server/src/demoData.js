/**
 * Demo mode. Real Classroom text is dense, unstructured, and buries the task —
 * these samples are written to match that, so the rewrite is exercised honestly.
 * Used when Google OAuth is not configured, or when a user picks "Try the demo".
 *
 * The due dates are not scattered at random. They're shaped into a realistic
 * bad week so the workload view has something true to show: an overdue item
 * that was quietly avoided rather than finished, a three-deadline pile-up on
 * one day, a genuinely clear stretch after it, and two long-horizon projects
 * where knowing when to *start* matters more than knowing when they're due.
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
  { id: 'demo-alg', name: 'Algebra 2', section: 'Period 2', room: 'C108', teacherFolderLink: null },
  { id: 'demo-spa', name: 'Spanish 3', section: 'Period 6', room: 'B117', teacherFolderLink: null },
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
    {
      id: 'demo-eng-3',
      courseId: 'demo-eng',
      title: 'Independent Reading — Book 3 Check-In',
      description: `Post a short response to the discussion board about whatever independent reading book you're currently on. Nothing formal, 150 words or so is fine. Tell me where you are in the book, one thing you noticed about how the author writes (not what happens — how it's written), and whether you'd recommend it. You should be roughly halfway through your third book by now. If you are not, that is something we should talk about, so please come see me rather than posting about a book you haven't started.`,
      workType: 'SHORT_ANSWER_QUESTION',
      maxPoints: 15,
      dueAt: daysFromNow(4, 23, 59),
      link: null,
      createdAt: daysFromNow(-5),
      submissionState: 'NEW',
      materials: [],
    },
    {
      id: 'demo-eng-4',
      courseId: 'demo-eng',
      title: 'Research Paper — Topic Proposal and Working Bibliography',
      description: `This is the first checkpoint for the semester research paper, which is due at the end of the term but which you should absolutely not be starting at the end of the term. For now I need three things from you: a narrowed topic question (not "social media" — something you could actually answer in eight pages), a one paragraph rationale for why that question is worth asking, and a working bibliography of at least five sources in MLA format. At least three of those five must be from the school database rather than open web. Databases are linked in the class materials. We will workshop these in class the week after they're submitted, so a proposal you're bored by is a proposal you'll be stuck with for a month.`,
      workType: 'ASSIGNMENT',
      maxPoints: 40,
      dueAt: daysFromNow(11),
      link: null,
      createdAt: daysFromNow(-1),
      submissionState: 'NEW',
      materials: [
        { kind: 'link', title: 'School Database Portal', url: '#' },
        { kind: 'file', title: 'Research Paper Full Assignment Sheet.pdf', url: '#' },
      ],
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
    {
      id: 'demo-bio-2',
      courseId: 'demo-bio',
      title: 'Photosynthesis Worksheet 12.3',
      description: `Complete the worksheet, both sides. Show the light-dependent and light-independent reactions separately.`,
      workType: 'ASSIGNMENT',
      maxPoints: 15,
      // Overdue and never handed in — the thing that quietly gets avoided.
      dueAt: daysFromNow(-2, 15, 0),
      link: null,
      createdAt: daysFromNow(-7),
      submissionState: 'NEW',
      materials: [{ kind: 'file', title: 'WS 12.3 Photosynthesis.pdf', url: '#' }],
    },
    {
      id: 'demo-bio-3',
      courseId: 'demo-bio',
      title: 'Unit 4 Test — Cellular Energy',
      description: `Unit 4 test covering everything from the start of the cellular energy unit: enzymes and activation energy, ATP structure and function, glycolysis, the Krebs cycle, the electron transport chain, fermentation, and photosynthesis including both the light reactions and the Calvin cycle. Format is 40 multiple choice, 4 short answer, and one extended response where you'll be asked to compare two processes. The study guide is posted but the study guide is not the test — it's a list of what to study, not a set of answers to memorize. Bring a calculator you can't text on.`,
      workType: 'ASSIGNMENT',
      maxPoints: 100,
      dueAt: daysFromNow(6, 14, 0),
      link: null,
      createdAt: daysFromNow(-3),
      submissionState: 'NEW',
      materials: [{ kind: 'file', title: 'Unit 4 Study Guide.pdf', url: '#' }],
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
    {
      id: 'demo-hist-3',
      courseId: 'demo-hist',
      title: 'Primary Source Analysis — Gilded Age Political Cartoons',
      description: `Pick two of the four cartoons in the packet and analyze each one. For each: identify the artist's point of view, explain what specific historical development the cartoon is responding to, describe two visual techniques the artist uses to make the argument, and explain who the intended audience was and how you can tell. One paragraph per cartoon is enough — this is about precision, not length. Do not summarize what the cartoon shows. Describing the picture is not analyzing it, and every year about half the class turns in a description.`,
      workType: 'ASSIGNMENT',
      maxPoints: 25,
      dueAt: daysFromNow(4, 23, 59),
      link: null,
      createdAt: daysFromNow(-2),
      submissionState: 'NEW',
      materials: [{ kind: 'file', title: 'Cartoon Packet.pdf', url: '#' }],
    },
    {
      id: 'demo-hist-4',
      courseId: 'demo-hist',
      title: 'Chapter 19 Reading Notes',
      description: `Read pages 439-467 and take Cornell notes, same format as always. Questions in the left column, notes in the right, summary at the bottom. The summary is the part that matters and the part most of you skip.`,
      workType: 'ASSIGNMENT',
      maxPoints: 10,
      dueAt: daysFromNow(0, 22, 0),
      link: null,
      createdAt: daysFromNow(-4),
      submissionState: 'NEW',
      materials: [],
    },
  ],

  'demo-alg': [
    {
      id: 'demo-alg-1',
      courseId: 'demo-alg',
      title: 'Problem Set 9.4 — Logarithmic Equations',
      description: `Odds 1-29 in section 9.4. Show all work, and by all work I mean the steps, not just the answer with a box around it — an answer with no work gets half credit even when it's right, because I'm grading whether you can do it, not whether you can get it. If you get stuck on the change of base problems (they start around 21) look at Example 4 on page 507, it's the same setup with different numbers.`,
      workType: 'ASSIGNMENT',
      maxPoints: 30,
      dueAt: daysFromNow(4, 15, 0),
      link: null,
      createdAt: daysFromNow(-1),
      submissionState: 'NEW',
      materials: [],
    },
    {
      id: 'demo-alg-2',
      courseId: 'demo-alg',
      title: 'Quiz Corrections — Quiz 9.2',
      description: `For every problem you missed, redo it correctly on a separate sheet and write one sentence explaining what went wrong the first time. "I made a careless mistake" is not an explanation — tell me what the actual error was, sign error, wrong formula, arithmetic, whatever it was. Corrections earn back half the points you lost.`,
      workType: 'ASSIGNMENT',
      maxPoints: 20,
      dueAt: daysFromNow(2, 15, 0),
      link: null,
      createdAt: daysFromNow(-3),
      submissionState: 'RETURNED',
      materials: [],
    },
    {
      id: 'demo-alg-3',
      courseId: 'demo-alg',
      title: 'Unit 9 Review Packet',
      description: `Full review packet for the Unit 9 test. It's long — 40 problems — and it's designed to be done across several sittings, not the night before. Answer key is posted so you can check yourself as you go, but checking the key before you've attempted the problem is how people walk into the test thinking they know it.`,
      workType: 'ASSIGNMENT',
      maxPoints: 25,
      dueAt: daysFromNow(9, 15, 0),
      link: null,
      createdAt: daysFromNow(-1),
      submissionState: 'NEW',
      materials: [{ kind: 'file', title: 'Unit 9 Review Packet.pdf', url: '#' }],
    },
  ],

  'demo-spa': [
    {
      id: 'demo-spa-1',
      courseId: 'demo-spa',
      title: 'Composición — Un recuerdo de la infancia',
      description: `Escribe una composición de 200-250 palabras sobre un recuerdo de tu infancia. Tienes que usar el imperfecto y el pretérito correctamente — el imperfecto para la descripción y el contexto, el pretérito para las acciones completas. Incluye por lo menos cinco verbos en cada tiempo. No uses traductor automático; lo noto siempre y la nota es cero. Si necesitas una palabra que no sabes, usa el diccionario y escribe la palabra en inglés entre paréntesis para que yo pueda ver lo que intentabas decir.`,
      workType: 'ASSIGNMENT',
      maxPoints: 50,
      dueAt: daysFromNow(4, 15, 0),
      link: null,
      createdAt: daysFromNow(-2),
      submissionState: 'NEW',
      materials: [{ kind: 'file', title: 'Rúbrica de composición.pdf', url: '#' }],
    },
    {
      id: 'demo-spa-2',
      courseId: 'demo-spa',
      title: 'Vocabulario Capítulo 6 — Práctica',
      description: `Complete the vocabulary practice set online. Two attempts allowed, higher score counts.`,
      workType: 'ASSIGNMENT',
      maxPoints: 10,
      dueAt: daysFromNow(1, 23, 59),
      link: null,
      createdAt: daysFromNow(-2),
      submissionState: 'TURNED_IN',
      materials: [],
    },
    {
      id: 'demo-spa-3',
      courseId: 'demo-spa',
      title: 'Presentación oral — proyecto cultural',
      description: `Presentación de 4-5 minutos sobre una tradición cultural de un país hispanohablante. Puedes usar diapositivas pero no puedes leer de ellas — máximo diez palabras por diapositiva. Habla en español todo el tiempo. Tienes que incluir: de dónde viene la tradición, qué significa para la gente, y una comparación con algo de tu propia cultura. Practica en voz alta antes; se nota mucho la diferencia entre alguien que practicó y alguien que escribió las diapositivas anoche.`,
      workType: 'ASSIGNMENT',
      maxPoints: 60,
      dueAt: daysFromNow(14, 15, 0),
      link: null,
      createdAt: daysFromNow(-2),
      submissionState: 'NEW',
      materials: [],
    },
  ],
}

export const demoCourseWork = (courseId) => DEMO_COURSEWORK[courseId] ?? []

export const findDemoCourseWork = (courseId, courseWorkId) =>
  demoCourseWork(courseId).find((w) => w.id === courseWorkId) ?? null
