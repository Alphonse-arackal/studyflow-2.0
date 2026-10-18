import { Routes, Route } from 'react-router-dom'

import AppLayout from './components/layout/AppLayout'

import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Notes from './pages/Notes'
import Revision from './pages/Revision'
import CalendarPage from './pages/CalendarPage'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/tasks" element={<Tasks />} />

        <Route path="/notes" element={<Notes />} />

        <Route path="/revision" element={<Revision />} />

        <Route path="/calendar" element={<CalendarPage />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App