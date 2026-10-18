import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppLayout() {
  const mode = useSelector((state) => state.theme.mode)

  // Apply the selected theme and save the preference.
  useEffect(() => {
    document.documentElement.dataset.theme = mode
    document.documentElement.style.colorScheme = mode

    localStorage.setItem('studyflow-theme', mode)
  }, [mode])

  return (
    <div className={`app-shell theme-${mode}`}>
      <Sidebar />

      <main className="main-area">
        <Topbar />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout