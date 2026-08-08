import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { AppShell } from './components/layout/AppShell'
import { SignInPage } from './pages/SignInPage'
import { CoursesPage } from './pages/CoursesPage'
import { CourseWorkPage } from './pages/CourseWorkPage'
import { AssignmentPage } from './pages/AssignmentPage'
import { StateBlock } from './components/ui/StateBlock'

function App() {
  const { loading, signedIn } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <StateBlock kind="loading" title="Loading cleared…" />
      </div>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={signedIn ? <Navigate to="/courses" replace /> : <SignInPage />} />
        <Route path="/courses" element={signedIn ? <CoursesPage /> : <Navigate to="/" replace />} />
        <Route
          path="/courses/:courseId"
          element={signedIn ? <CourseWorkPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/courses/:courseId/coursework/:workId"
          element={signedIn ? <AssignmentPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
