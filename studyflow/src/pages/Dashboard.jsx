import { useEffect, useMemo, useState } from 'react'
import { tasksAPI } from '../services/api'
import {
  FiCalendar, FiCheck, FiCheckSquare, FiCircle, FiClock, FiFileText,
  FiList, FiMoon, FiPlus, FiSettings, FiSun, FiTarget, FiBell,
  FiChevronDown, FiSearch, FiPlay, FiPause, FiRotateCcw, FiWatch,
} from 'react-icons/fi'

function localDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date
}
function dateLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function getDateKeyForDashboard(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function taskDateLabel(task) {
  if (!task.date) return 'No date'
  const date = new Date(`${task.date}T12:00:00`)
  return dateLabel(date)
}

function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [quickNotes, setQuickNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studyflow_quick_notes') || '[]') } catch { return [] }
  })
  const [showQuickNoteForm, setShowQuickNoteForm] = useState(false)
  const [quickNoteTitle, setQuickNoteTitle] = useState('')
  const [quickNoteContent, setQuickNoteContent] = useState('')
  const [quickNoteError, setQuickNoteError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [taskDraft, setTaskDraft] = useState('')
  const [mode, setMode] = useState('timer')
  const [seconds, setSeconds] = useState(11 * 60)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [running, setRunning] = useState(false)
  const [duration, setDuration] = useState(25)
  const [showTimerSettings, setShowTimerSettings] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadDashboardData() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const loadedTasks = await tasksAPI.getAll()
        if (cancelled) return
        setTasks(Array.isArray(loadedTasks) ? loadedTasks : [])
      } catch (error) {
        if (!cancelled) setErrorMessage('Could not load your saved tasks. Make sure JSON Server is running on port 3001.')
        console.error('Failed to load dashboard data:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadDashboardData()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    localStorage.setItem('studyflow_quick_notes', JSON.stringify(quickNotes))
  }, [quickNotes])

  const saveQuickNote = (event) => {
    event.preventDefault()
    const title = quickNoteTitle.trim()
    const content = quickNoteContent.trim()
    if (!title && !content) { setQuickNoteError('Enter a title or a reminder first.'); return }
    setQuickNotes((previous) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: title || 'Quick reminder', content, createdAt: new Date().toISOString() }, ...previous])
    setQuickNoteTitle('')
    setQuickNoteContent('')
    setQuickNoteError('')
    setShowQuickNoteForm(false)
  }

  useEffect(() => {
    const clockInterval = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(clockInterval)
  }, [])

  useEffect(() => {
    if (!running || mode === 'clock') return undefined
    const id = window.setInterval(() => {
      setSeconds((value) => {
        if (mode === 'stopwatch') return value + 1
        return Math.max(0, value - 1)
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, mode])

  useEffect(() => {
    if (mode === 'timer' && seconds === 0) setRunning(false)
  }, [seconds, mode])

  const todayKey = getDateKeyForDashboard(localDate())
  const twoDaysAhead = getDateKeyForDashboard(localDate(2))
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const taskDate = task.date || todayKey
    const matchesDate = taskDate >= todayKey && taskDate <= twoDaysAhead
    const matchesSearch = `${task.title || ''} ${task.description || ''}`.toLowerCase().includes(search.toLowerCase())
    return matchesDate && matchesSearch
  }), [tasks, search, todayKey, twoDaysAhead])
  const todayTasks = visibleTasks.filter((task) => (task.date || todayKey) === todayKey)
  const completedToday = todayTasks.filter((task) => task.completed).length
  const progress = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0
  const timerDisplay = mode === 'clock'
    ? currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  const addTask = async (event) => {
    event.preventDefault()
    const title = taskDraft.trim()
    if (!title) return
    setErrorMessage('')
    try {
      const created = await tasksAPI.create({ title, date: todayKey, completed: false })
      setTasks((current) => [...current, created])
      setTaskDraft('')
      setAddingTask(false)
    } catch (error) {
      setErrorMessage('Could not save the task. Please check JSON Server and try again.')
      console.error('Failed to add dashboard task:', error)
    }
  }

  const toggleTask = async (task) => {
    setErrorMessage('')
    try {
      const saved = await tasksAPI.update(task.id, { completed: !task.completed })
      setTasks((current) => current.map((item) => String(item.id) === String(task.id) ? { ...item, ...saved, completed: !task.completed } : item))
    } catch (error) {
      setErrorMessage('Could not update the task. Please try again.')
      console.error('Failed to update dashboard task:', error)
    }
  }

  const chooseMode = (nextMode) => {
    setRunning(false)
    setMode(nextMode)
    if (nextMode === 'timer') setSeconds(duration * 60)
    if (nextMode === 'stopwatch') setSeconds(0)
  }
  const resetTimer = () => {
    setRunning(false)
    setSeconds(mode === 'stopwatch' ? 0 : duration * 60)
  }

  return (
    <div className="page dashboard-page reference-dashboard">
      {(isLoading || errorMessage) && <div role="status" style={{ padding: '10px 14px', marginBottom: 12, borderRadius: 10, background: errorMessage ? 'rgba(220,70,70,.12)' : 'rgba(120,120,120,.1)' }}>{errorMessage || 'Loading your dashboard...'}</div>}
      <header className="reference-dashboard-heading">
        <div className="reference-title-wrap">
          <h2>Tasks <span>—</span> <time>{dateLabel(localDate())}</time></h2>
          <p>Keep your day clear, focused, and moving forward.</p>
        </div>
        <button className="primary-button reference-add-task" onClick={() => setAddingTask((value) => !value)} type="button" disabled={isLoading}>
          <FiPlus size={20} /> Add Task
        </button>
      </header>

      {addingTask && <form className="reference-inline-form" onSubmit={addTask}>
        <input autoFocus value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="What do you need to do?" aria-label="New task title" />
        <button className="primary-button" type="submit">Save task</button>
        <button className="secondary-button" type="button" onClick={() => setAddingTask(false)}>Cancel</button>
      </form>}

      <div className="reference-dashboard-grid">
        <section className="reference-panel reference-tasks-panel">
          <div className="reference-panel-heading">
            <div className="reference-panel-title"><span className="reference-heading-icon"><FiList size={21} /></span><div><h3>My tasks</h3><p>Your upcoming study priorities</p></div></div>
            <span className="reference-count">{visibleTasks.length} tasks</span>
          </div>
          <div className="reference-task-list">
            {visibleTasks.map((task) => (
              <article className={`reference-task-row ${task.completed ? 'is-complete' : ''}`} key={task.id}>
                <span className={`reference-task-dot ${task.color}`} />
                <button className="reference-task-copy" type="button" onClick={() => toggleTask(task)}>
                  <strong>{task.title}</strong><span>{task.description}</span>
                </button>
                <span className="reference-task-date"><FiCalendar size={16} />{taskDateLabel(task)}</span>
                <button className={`reference-task-check ${task.completed ? 'checked' : ''}`} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} onClick={() => toggleTask(task)} type="button">
                  {task.completed && <FiCheck size={17} />}
                </button>
              </article>
            ))}
            {visibleTasks.length === 0 && <div className="reference-empty">No matching tasks. Add one to get started.</div>}
          </div>
          <div className="reference-progress-card">
            <div className="reference-progress-heading"><strong>Today's tasks</strong><span><b>{progress}%</b> ({completedToday}/{todayTasks.length})</span></div>
            <div className="reference-progress-track"><span style={{ width: `${progress}%` }} /></div>
          </div>
        </section>

        <div className="reference-right-column">
          <section className="reference-panel reference-notes-panel">
            <div className="reference-panel-heading">
              <div className="reference-panel-title"><span className="reference-heading-icon"><FiFileText size={21} /></span><div><h3>Quick notes</h3><p>Little reminders for later</p></div></div>
              <button className="reference-square-button" type="button" aria-label="Add quick note" onClick={() => { setShowQuickNoteForm((value) => !value); setQuickNoteError('') }}><FiPlus size={21} /></button>
            </div>
            {showQuickNoteForm && <form className="reference-quick-note-form" onSubmit={saveQuickNote}>
              <input aria-label="Quick note title" placeholder="Note title (optional)" value={quickNoteTitle} onChange={(event) => setQuickNoteTitle(event.target.value)} maxLength={80} autoFocus />
              <textarea aria-label="Quick note reminder" placeholder="Write a quick reminder..." value={quickNoteContent} onChange={(event) => setQuickNoteContent(event.target.value)} rows={3} maxLength={500} />
              {quickNoteError && <small className="reference-quick-note-error">{quickNoteError}</small>}
              <div className="reference-quick-note-actions"><button type="button" className="secondary-button" onClick={() => { setShowQuickNoteForm(false); setQuickNoteError('') }}>Cancel</button><button type="submit" className="primary-button">Save note</button></div>
            </form>}
            <ul className="reference-notes-list">
              {quickNotes.slice(0, 5).map((note, index) => <li key={note.id}><span className={`reference-note-dot note-${index % 3}`} /><span className="reference-quick-note-copy"><strong>{note.title || 'Quick reminder'}</strong>{note.content && <small>{note.content.slice(0, 90)}{note.content.length > 90 ? '…' : ''}</small>}</span><button className="reference-quick-note-delete" type="button" aria-label={`Delete ${note.title || 'quick note'}`} title="Delete quick note" onClick={() => setQuickNotes((previous) => previous.filter((item) => item.id !== note.id))}>×</button></li>)}
              {quickNotes.length === 0 && <li className="reference-empty">No quick notes yet. Select + to add a reminder.</li>}
            </ul>
          </section>

          <section className="reference-panel reference-timer-panel">
            <div className="reference-panel-heading">
              <div className="reference-panel-title"><span className="reference-heading-icon timer-heading-icon"><FiClock size={22} /></span><div><h3>Focus Timer</h3><p>Make time for what matters</p></div></div>
              <button className="reference-plain-icon" type="button" aria-label="Timer settings" onClick={() => setShowTimerSettings((value) => !value)}><FiSettings size={20} /></button>
            </div>
            {showTimerSettings && <form className="reference-timer-settings" onSubmit={(event) => { event.preventDefault(); setSeconds(duration * 60); setMode('timer'); setRunning(false); setShowTimerSettings(false) }}><label htmlFor="focus-duration">Focus duration (minutes)</label><input id="focus-duration" type="number" min="1" max="180" value={duration} onChange={(event) => setDuration(Math.min(180, Math.max(1, Number(event.target.value) || 1)))} /><button className="primary-button" type="submit">Apply</button></form>}
            <div className={`reference-timer-ring ${running ? 'is-running' : ''}`}><div className="reference-timer-inner"><span className={`reference-timer-time ${mode === 'clock' ? 'is-clock' : ''}`}>{timerDisplay}</span>{mode !== 'clock' && <span className="reference-timer-caption">{mode === 'stopwatch' ? (running ? 'STOPWATCH RUNNING' : 'ELAPSED TIME') : (running ? 'STAY IN THE FLOW' : seconds === 0 ? 'SESSION COMPLETE' : 'READY TO FOCUS')}</span>}</div></div>
            <div className="reference-timer-controls">
              <button className={mode === 'clock' ? 'active' : ''} onClick={() => chooseMode('clock')} type="button"><FiClock size={18} />Clock</button>
              <button className={mode === 'timer' ? 'active' : ''} onClick={() => chooseMode('timer')} type="button"><FiTarget size={18} />Timer</button>
              <button className={mode === 'stopwatch' ? 'active' : ''} onClick={() => chooseMode('stopwatch')} type="button"><FiWatch size={18} />Stopwatch</button>
            </div>
            {mode !== 'clock' && <div className="reference-timer-actions"><button className="primary-button" type="button" onClick={() => setRunning((value) => !value)}>{running ? <FiPause size={16} /> : <FiPlay size={16} />}{running ? 'Pause' : mode === 'stopwatch' && seconds > 0 ? 'Resume' : 'Start session'}</button><button className="secondary-button" type="button" onClick={resetTimer} aria-label="Reset timer"><FiRotateCcw size={16} />Reset</button></div>}
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
