import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiSearch, FiBell, FiX, FiCheckCircle, FiCalendar, FiBookOpen, FiCheckSquare, FiLayers } from 'react-icons/fi'
import ThemeToggle from '../common/ThemeToggle'
import { tasksAPI, commonTasksAPI, notesAPI, eventsAPI, flashcardsAPI, mockTestsAPI } from '../../services/api'

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Your personal learning space.' },
  '/tasks': { title: 'My Tasks', subtitle: 'Plan your work and stay on track.' },
  '/notes': { title: 'My Notes', subtitle: 'Organize your knowledge in one place.' },
  '/revision': { title: 'Revision', subtitle: 'Review, practice, and remember more.' },
  '/calendar': { title: 'Calendar', subtitle: 'Plan your study schedule.' },
}

const safeList = async (api) => {
  try {
    const value = await api.getAll()
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const labelFor = (item) => item.title || item.name || item.subject || item.question || item.text || 'Untitled item'
const dateFor = (item) => item.date || item.dueDate || item.startDate || item.eventDate || ''
const isCompleted = (item) => item.completed === true || item.isCompleted === true || item.status === 'completed'

function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchItems, setSearchItems] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationItems, setNotificationItems] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyflow-dismissed-notifications') || '[]') } catch { return [] }
  })
  const searchRef = useRef(null)
  const panelRef = useRef(null)

  const page = pageTitles[location.pathname] || { title: 'StudyFlow', subtitle: 'Your personal learning space.' }

  useEffect(() => {
    let active = true
    setSearchLoading(true)
    Promise.all([
      safeList(tasksAPI), safeList(commonTasksAPI), safeList(notesAPI),
      safeList(eventsAPI), safeList(flashcardsAPI), safeList(mockTestsAPI),
    ]).then(([tasks, commonTasks, notes, events, flashcards, mockTests]) => {
      if (!active) return
      setSearchItems([
        ...tasks.map((item) => ({ ...item, _kind: 'Task', _path: '/tasks', _icon: FiCheckSquare, _id: `task-${item.id}` })),
        ...commonTasks.map((item) => ({ ...item, _kind: 'Task', _path: '/tasks', _icon: FiCheckSquare, _id: `common-${item.id}` })),
        ...notes.map((item) => ({ ...item, _kind: 'Note', _path: '/notes', _icon: FiBookOpen, _id: `note-${item.id}` })),
        ...events.map((item) => ({ ...item, _kind: 'Calendar event', _path: '/calendar', _icon: FiCalendar, _id: `event-${item.id}` })),
        ...flashcards.map((item) => ({ ...item, _kind: 'Flashcard', _path: '/revision', _icon: FiLayers, _id: `flashcard-${item.id}` })),
        ...mockTests.map((item) => ({ ...item, _kind: 'Mock test', _path: '/revision', _icon: FiLayers, _id: `test-${item.id}` })),
      ])
      setSearchError(false)
    }).catch(() => { if (active) setSearchError(true) }).finally(() => { if (active) setSearchLoading(false) })
    return () => { active = false }
  }, [location.pathname])

  useEffect(() => {
    let active = true
    setNotificationsLoading(true)
    Promise.all([safeList(tasksAPI), safeList(commonTasksAPI), safeList(eventsAPI)]).then(([tasks, commonTasks, events]) => {
      if (!active) return
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const items = [
        ...tasks.map((item) => ({ ...item, _kind: 'Task', _path: '/tasks', _id: `task-${item.id}` })),
        ...commonTasks.map((item) => ({ ...item, _kind: 'Task', _path: '/tasks', _id: `common-${item.id}` })),
        ...events.map((item) => ({ ...item, _kind: 'Event', _path: '/calendar', _id: `event-${item.id}` })),
      ].filter((item) => {
        if (isCompleted(item)) return false
        const rawDate = dateFor(item)
        if (!rawDate) return false
        const date = new Date(rawDate)
        if (Number.isNaN(date.getTime())) return false
        date.setHours(0, 0, 0, 0)
        return date <= tomorrow
      }).map((item) => {
        const rawDate = dateFor(item)
        const date = new Date(rawDate)
        date.setHours(0, 0, 0, 0)
        const dateLabel = date.getTime() < today.getTime() ? 'Overdue' : date.getTime() === today.getTime() ? 'Due today' : 'Due tomorrow'
        return { ...item, _message: `${item._kind} · ${dateLabel}` }
      }).sort((a, b) => new Date(dateFor(a)) - new Date(dateFor(b)))
      setNotificationItems(items)
    }).finally(() => { if (active) setNotificationsLoading(false) })
    return () => { active = false }
  }, [location.pathname])

  const filteredResults = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []
    return searchItems.filter((item) => {
      const searchable = [labelFor(item), item.content, item.description, item.question, item.answer, item.subject, item._kind].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(term)
    }).slice(0, 8)
  }, [query, searchItems])

  const activeNotifications = notificationItems.filter((item) => !dismissedIds.includes(item._id))

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && !searchRef.current?.contains(event.target)) {
        setSearchOpen(false)
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [])

  const openResult = (item) => {
    navigate(item._path)
    setQuery('')
    setSearchOpen(false)
    setNotificationsOpen(false)
  }

  const dismissNotification = (event, id) => {
    event.stopPropagation()
    const next = [...new Set([...dismissedIds, id])]
    setDismissedIds(next)
    localStorage.setItem('studyflow-dismissed-notifications', JSON.stringify(next))
  }

  return (
    <header className="topbar">
      <div className="page-heading">
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search-wrap" ref={searchRef}>
          <label className="search-box">
            <FiSearch size={18} />
            <input
              type="search"
              placeholder="Search tasks, notes, events..."
              aria-label="Search StudyFlow"
              value={query}
              onFocus={() => { setSearchOpen(true); setNotificationsOpen(false) }}
              onChange={(event) => { setQuery(event.target.value); setSearchOpen(true) }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') { setSearchOpen(false); setQuery('') }
                if (event.key === 'Enter' && filteredResults[0]) openResult(filteredResults[0])
              }}
            />
            {query ? <button className="search-clear" type="button" aria-label="Clear search" onClick={() => { setQuery(''); setSearchOpen(true) }}><FiX size={15} /></button> : <span className="search-shortcut">/</span>}
          </label>
          {searchOpen && query.trim() && (
            <div className="topbar-popover search-results-popover" ref={panelRef}>
              <div className="popover-heading">Search results</div>
              {searchLoading ? <p className="popover-empty">Searching your StudyFlow data…</p> : searchError ? <p className="popover-empty">Could not load search data. Check that JSON Server is running.</p> : filteredResults.length ? filteredResults.map((item) => {
                const Icon = item._icon
                return <button className="search-result-item" type="button" key={item._id} onClick={() => openResult(item)}><span className="result-icon"><Icon size={16} /></span><span className="result-copy"><strong>{labelFor(item)}</strong><small>{item._kind}{item.subject ? ` · ${item.subject}` : ''}</small></span><span className="result-arrow">↗</span></button>
              }) : <p className="popover-empty">No matches found for “{query.trim()}”.</p>}
              <div className="popover-footnote">Searches your tasks, notes, calendar events, and revision items.</div>
            </div>
          )}
        </div>

        <ThemeToggle />

        <div className="notification-wrap" ref={panelRef}>
          <button type="button" className="icon-button notification-button" aria-label="Notifications" title="Notifications" onClick={() => { setNotificationsOpen((open) => !open); setSearchOpen(false); setQuery('') }}>
            <FiBell size={19} />
            {activeNotifications.length > 0 && <span className="notification-dot" />}
            {activeNotifications.length > 0 && <span className="notification-count">{activeNotifications.length > 9 ? '9+' : activeNotifications.length}</span>}
          </button>
          {notificationsOpen && (
            <div className="topbar-popover notifications-popover">
              <div className="notifications-title-row"><div><strong>Notifications</strong><small>{activeNotifications.length ? `${activeNotifications.length} reminders` : 'You’re all caught up'}</small></div>{activeNotifications.length > 0 && <button type="button" className="dismiss-all-button" onClick={() => { const next = [...new Set([...dismissedIds, ...activeNotifications.map((item) => item._id)])]; setDismissedIds(next); localStorage.setItem('studyflow-dismissed-notifications', JSON.stringify(next)) }}>Clear all</button>}</div>
              {notificationsLoading ? <p className="popover-empty">Checking your schedule…</p> : activeNotifications.length ? <div className="notification-list">{activeNotifications.map((item) => <div className="notification-item" key={item._id}><button type="button" className="notification-main" onClick={() => openResult(item)}><span className="notification-item-icon"><FiCalendar size={16} /></span><span className="notification-copy"><strong>{labelFor(item)}</strong><small>{item._message}</small></span></button><button type="button" className="notification-dismiss" aria-label={`Dismiss ${labelFor(item)}`} title="Dismiss" onClick={(event) => dismissNotification(event, item._id)}><FiX size={15} /></button></div>)}</div> : <div className="notifications-empty"><span><FiCheckCircle size={22} /></span><strong>No upcoming reminders</strong><p>Tasks or events due today or tomorrow will appear here.</p></div>}
              <div className="popover-footnote">Based on your saved tasks and calendar events.</div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
