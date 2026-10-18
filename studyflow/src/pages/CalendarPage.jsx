import { useEffect, useMemo, useState } from 'react'
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiClock,
  FiMapPin,
  FiTrash2,
  FiBookOpen,
  FiCheckSquare,
  FiX,
  FiMoreHorizontal,
} from 'react-icons/fi'
import { eventsAPI, timetableAPI } from '../services/api'

const EVENT_COLORS = {
  Event: 'sage',
  Exam: 'rose',
  Deadline: 'amber',
  Meeting: 'blue',
  Personal: 'lavender',
}

function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`)
}

function formatSelectedDate(dateKey, options = {}) {
  return dateFromKey(dateKey).toLocaleDateString('en-US', {
    weekday: options.short ? 'short' : 'long',
    month: options.short ? 'short' : 'long',
    day: 'numeric',
    ...(options.year ? { year: 'numeric' } : {}),
  })
}

function formatTime(time) {
  if (!time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function CalendarPage() {
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(getDateKey(today))
  const [events, setEvents] = useState([])
  const [timetableBlocks, setTimetableBlocks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadCalendarData() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const [loadedEvents, loadedBlocks] = await Promise.all([
          eventsAPI.getAll(), timetableAPI.getAll(),
        ])
        if (cancelled) return
        setEvents(Array.isArray(loadedEvents) ? loadedEvents : [])
        setTimetableBlocks(Array.isArray(loadedBlocks) ? loadedBlocks : [])
      } catch (error) {
        if (!cancelled) setErrorMessage('Could not load calendar data. Make sure JSON Server is running on port 3001, then refresh.')
        console.error('Failed to load calendar data:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadCalendarData()
    return () => { cancelled = true }
  }, [])
  const [showEventForm, setShowEventForm] = useState(false)
  const [showTimetableForm, setShowTimetableForm] = useState(false)
  const [viewMode, setViewMode] = useState('Month')
  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState('Event')
  const [eventDescription, setEventDescription] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [blockTitle, setBlockTitle] = useState('')
  const [blockStart, setBlockStart] = useState('09:00')
  const [blockEnd, setBlockEnd] = useState('10:00')
  const [blockType, setBlockType] = useState('Study')

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const monthName = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  const calendarDays = useMemo(() => {
    const days = Array.from({ length: firstWeekday }, () => null)
    for (let day = 1; day <= daysInMonth; day += 1) days.push(day)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [firstWeekday, daysInMonth])

  const selectedEvents = events.filter((event) => event.date === selectedDate)
  const selectedBlocks = timetableBlocks
    .filter((block) => block.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const selectedDateObject = dateFromKey(selectedDate)
  const isSelectedToday = selectedDate === getDateKey(new Date())

  const getEventsForDate = (dateKey) => events.filter((event) => event.date === dateKey)
  const getBlocksForDate = (dateKey) => timetableBlocks.filter((block) => block.date === dateKey)

  const changeMonth = (amount) => {
    setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + amount, 1))
  }

  const selectDay = (day) => {
    if (!day) return
    setSelectedDate(getDateKey(new Date(year, month, day)))
  }

  const goToToday = () => {
    const now = new Date()
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(getDateKey(now))
  }

  const openEventForm = () => {
    setShowEventForm(true)
    setShowTimetableForm(false)
  }

  const openTimetableForm = () => {
    setShowTimetableForm(true)
    setShowEventForm(false)
  }

  const addEvent = async (event) => {
    event.preventDefault()
    const title = eventTitle.trim()
    if (!title) return
    setErrorMessage('')
    try {
      const savedEvent = await eventsAPI.create({
        title, date: selectedDate, type: eventType,
        description: eventDescription.trim(), location: eventLocation.trim(),
      })
      setEvents((previous) => [...previous, savedEvent])
      setEventTitle('')
      setEventDescription('')
      setEventLocation('')
      setEventType('Event')
      setShowEventForm(false)
    } catch (error) {
      setErrorMessage('Could not save the event. Check that JSON Server is running and try again.')
      console.error('Failed to save event:', error)
    }
  }

  const addTimetableBlock = async (event) => {
    event.preventDefault()
    const title = blockTitle.trim()
    if (!title) return
    if (blockEnd <= blockStart) {
      window.alert('The end time must be later than the start time.')
      return
    }
    setErrorMessage('')
    try {
      const savedBlock = await timetableAPI.create({
        title, date: selectedDate, startTime: blockStart,
        endTime: blockEnd, type: blockType,
      })
      setTimetableBlocks((previous) => [...previous, savedBlock])
      setBlockTitle('')
      setBlockStart('09:00')
      setBlockEnd('10:00')
      setBlockType('Study')
      setShowTimetableForm(false)
    } catch (error) {
      setErrorMessage('Could not save the timetable block. Check that JSON Server is running and try again.')
      console.error('Failed to save timetable block:', error)
    }
  }

  const deleteEvent = async (id) => {
    setErrorMessage('')
    try {
      await eventsAPI.delete(id)
      setEvents((previous) => previous.filter((event) => String(event.id) !== String(id)))
    } catch (error) {
      setErrorMessage('Could not delete the event. Please try again.')
      console.error('Failed to delete event:', error)
    }
  }

  const deleteTimetableBlock = async (id) => {
    setErrorMessage('')
    try {
      await timetableAPI.delete(id)
      setTimetableBlocks((previous) => previous.filter((block) => String(block.id) !== String(id)))
    } catch (error) {
      setErrorMessage('Could not delete the timetable block. Please try again.')
      console.error('Failed to delete timetable block:', error)
    }
  }

  const renderEventPills = (dateKey) => {
    const dayEvents = getEventsForDate(dateKey)
    const dayBlocks = getBlocksForDate(dateKey)
    const items = [
      ...dayEvents.map((event) => ({ id: event.id, title: event.title, color: EVENT_COLORS[event.type] || 'sage' })),
      ...dayBlocks.map((block) => ({ id: block.id, title: block.title, color: block.type === 'Break' ? 'amber' : 'blue' })),
    ].slice(0, 2)
    return items.map((item) => <span className={`calendar-event-pill ${item.color}`} key={`${item.id}-${item.title}`}>{item.title}</span>)
  }

  const renderEventForm = () => showEventForm && (
    <form className="calendar-form calendar-form-inline" onSubmit={addEvent}>
      <div className="calendar-form-heading">
        <h4>New event</h4>
        <button type="button" className="small-icon-button" onClick={() => setShowEventForm(false)} aria-label="Close event form"><FiX /></button>
      </div>
      <label>Event title<input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Semester examination" required /></label>
      <label>Event type<select value={eventType} onChange={(e) => setEventType(e.target.value)}><option>Event</option><option>Exam</option><option>Deadline</option><option>Meeting</option><option>Personal</option></select></label>
      <label>Location (optional)<input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Enter location" /></label>
      <label>Description (optional)<textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Add details..." rows={2} /></label>
      <button type="submit" className="primary-button"><FiPlus /> Save event</button>
    </form>
  )

  const renderTimetableForm = () => showTimetableForm && (
    <form className="calendar-form calendar-form-inline" onSubmit={addTimetableBlock}>
      <div className="calendar-form-heading">
        <h4>New timetable block</h4>
        <button type="button" className="small-icon-button" onClick={() => setShowTimetableForm(false)} aria-label="Close timetable form"><FiX /></button>
      </div>
      <label>Activity title<input value={blockTitle} onChange={(e) => setBlockTitle(e.target.value)} placeholder="e.g. Database revision" required /></label>
      <label>Activity type<select value={blockType} onChange={(e) => setBlockType(e.target.value)}><option>Study</option><option>Class</option><option>Break</option><option>Personal</option></select></label>
      <div className="calendar-time-fields">
        <label>Start time<input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} required /></label>
        <label>End time<input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} required /></label>
      </div>
      <button type="submit" className="primary-button"><FiPlus /> Save time block</button>
    </form>
  )

  return (
    <div className="page calendar-page calendar-redesign">
      {(isLoading || errorMessage) && (
        <div role="status" style={{ padding: '10px 14px', marginBottom: 12, borderRadius: 10, background: errorMessage ? 'rgba(220,70,70,.12)' : 'rgba(120,120,120,.1)' }}>
          {errorMessage || 'Loading calendar data...'}
        </div>
      )}
      <section className="calendar-page-heading">
        <div>
          <span className="eyebrow">YOUR STUDY SCHEDULE</span>
          <h2>Calendar</h2>
          <p>Keep your study sessions, deadlines, and plans in one place.</p>
        </div>
        <button type="button" className="primary-button calendar-heading-add" onClick={openEventForm} disabled={isLoading}><FiPlus /> Add event</button>
      </section>

      <section className="content-card calendar-month-card">
        <div className="calendar-toolbar calendar-redesign-toolbar">
          <div className="calendar-toolbar-title">
            <h3>{monthName}</h3>
            <p>Select a date to see its plan.</p>
          </div>
          <div className="calendar-toolbar-actions">
            <button type="button" className="today-button" onClick={goToToday}>Today</button>
            <div className="calendar-month-controls">
              <button type="button" className="icon-button" onClick={() => changeMonth(-1)} aria-label="Previous month" title="Previous month"><FiChevronLeft /></button>
              <button type="button" className="icon-button" onClick={() => changeMonth(1)} aria-label="Next month" title="Next month"><FiChevronRight /></button>
            </div>
            <div className="calendar-view-switch" role="group" aria-label="Calendar view">
              {['Month', 'Week', 'List'].map((mode) => <button type="button" key={mode} className={viewMode === mode ? 'active' : ''} onClick={() => setViewMode(mode)}>{mode}</button>)}
            </div>
          </div>
        </div>

        {viewMode === 'Month' ? (
          <div className="calendar-grid calendar-redesign-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
            {calendarDays.map((day, index) => {
              const dateKey = day ? getDateKey(new Date(year, month, day)) : null
              const isToday = dateKey === getDateKey(new Date())
              const isSelected = dateKey === selectedDate
              return (
                <button key={`${day ?? 'blank'}-${index}`} type="button" disabled={!day}
                  className={['calendar-day calendar-redesign-day', !day ? 'empty-day' : '', isToday ? 'today' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ')}
                  onClick={() => selectDay(day)} aria-label={dateKey ? `Select ${formatSelectedDate(dateKey)}` : undefined} aria-pressed={isSelected}>
                  {day && <>
                    <span className="calendar-day-number">{day}</span>
                    <span className="calendar-day-events">{renderEventPills(dateKey)}</span>
                    {(getEventsForDate(dateKey).length + getBlocksForDate(dateKey).length > 2) && <small className="calendar-more-count">+{getEventsForDate(dateKey).length + getBlocksForDate(dateKey).length - 2} more</small>}
                  </>}
                </button>
              )
            })}
          </div>
        ) : viewMode === 'Week' ? (
          <div className="calendar-week-view">
            {Array.from({ length: 7 }, (_, index) => {
              const start = new Date(selectedDateObject)
              start.setDate(start.getDate() - start.getDay() + index)
              const dateKey = getDateKey(start)
              const dayEvents = getEventsForDate(dateKey)
              const dayBlocks = getBlocksForDate(dateKey)
              return <button type="button" className={`calendar-week-day ${dateKey === selectedDate ? 'active' : ''}`} key={dateKey} onClick={() => setSelectedDate(dateKey)}>
                <span>{start.toLocaleDateString('en-US', { weekday: 'short' })}</span><strong>{start.getDate()}</strong>
                <small>{dayEvents.length + dayBlocks.length ? `${dayEvents.length + dayBlocks.length} planned` : 'No plans'}</small>
                {[...dayEvents, ...dayBlocks].slice(0, 2).map((item) => <em key={item.id}>{item.title}</em>)}
              </button>
            })}
          </div>
        ) : (
          <div className="calendar-list-view">
            {[...events, ...timetableBlocks].filter((item) => item.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).sort((a, b) => a.date.localeCompare(b.date)).map((item) => <button type="button" key={`${item.id}-${item.date}`} className="calendar-list-row" onClick={() => setSelectedDate(item.date)}>
              <span className="calendar-list-date">{formatSelectedDate(item.date, { short: true })}</span><span>{item.title}</span><small>{item.type || 'Study'}</small>
            </button>)}
            {events.concat(timetableBlocks).filter((item) => item.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length === 0 && <div className="calendar-empty-state"><p>No plans this month yet. Add an event or timetable block to get started.</p></div>}
          </div>
        )}

        <div className="calendar-legend calendar-redesign-legend">
          <span><i className="legend-dot event-dot" /> Events</span>
          <span><i className="legend-dot timetable-dot" /> Study blocks</span>
          <span><i className="legend-dot deadline-dot" /> Deadlines</span>
        </div>
      </section>

      <section className="calendar-bottom-grid">
        <div className="content-card calendar-timetable-panel">
          <div className="calendar-bottom-heading">
            <div className="calendar-bottom-heading-icon"><FiClock /></div>
            <div><h3>Timetable</h3><p>{formatSelectedDate(selectedDate)}</p></div>
            <span className="calendar-count-badge">{selectedBlocks.length}</span>
          </div>
          {selectedBlocks.length ? <div className="calendar-timetable-list">
            {selectedBlocks.map((block) => <article className={`calendar-timetable-row ${block.type.toLowerCase()}`} key={block.id}>
              <div className="calendar-timetable-time"><strong>{formatTime(block.startTime)}</strong><span>{formatTime(block.endTime)}</span></div>
              <div className="calendar-timetable-copy"><h4>{block.title}</h4><p>{block.type}</p></div>
              <button type="button" className="task-delete-button" onClick={() => deleteTimetableBlock(block.id)} aria-label={`Delete timetable block ${block.title}`}><FiTrash2 /></button>
            </article>)}
          </div> : <div className="calendar-empty-state calendar-empty-compact"><FiClock /><p>No time blocks planned for this day.</p></div>}
          <button type="button" className="calendar-add-time-button" onClick={openTimetableForm} disabled={isLoading}><FiPlus /> Add time block</button>
          {renderTimetableForm()}
        </div>

        <div className="content-card calendar-selected-day-panel">
          <div className="calendar-bottom-heading">
            <div className="calendar-bottom-heading-icon"><FiCalendar /></div>
            <div><h3>Selected day</h3><p>{formatSelectedDate(selectedDate, { year: true })}</p></div>
            {isSelectedToday && <span className="calendar-today-tag">Today</span>}
          </div>
          <div className="calendar-selected-day-actions">
            <button type="button" className="primary-button" onClick={openEventForm}><FiPlus /> Add event</button>
            <button type="button" className="secondary-button" onClick={openTimetableForm}><FiClock /> Add time</button>
          </div>
          {renderEventForm()}
          {!selectedEvents.length && !selectedBlocks.length ? <div className="calendar-empty-state calendar-empty-compact"><FiCalendar /><p>Your day is clear. Add an event or plan a study block.</p></div> : (
            <div className="calendar-agenda-list">
              {selectedEvents.map((event) => <article className={`calendar-agenda-row ${EVENT_COLORS[event.type] || 'sage'}`} key={event.id}>
                <span className="calendar-agenda-color" />
                <div className="calendar-agenda-copy"><span className="calendar-agenda-type">{event.type}</span><h4>{event.title}</h4>{event.location && <p><FiMapPin /> {event.location}</p>}{event.description && <p>{event.description}</p>}</div>
                <button type="button" className="task-delete-button" onClick={() => deleteEvent(event.id)} aria-label={`Delete event ${event.title}`}><FiTrash2 /></button>
              </article>)}
              {selectedBlocks.map((block) => <article className="calendar-agenda-row blue" key={block.id}>
                <span className="calendar-agenda-color" />
                <div className="calendar-agenda-copy"><span className="calendar-agenda-type">{formatTime(block.startTime)} – {formatTime(block.endTime)}</span><h4>{block.title}</h4><p>{block.type}</p></div>
                <button type="button" className="task-delete-button" onClick={() => deleteTimetableBlock(block.id)} aria-label={`Delete timetable block ${block.title}`}><FiTrash2 /></button>
              </article>)}
            </div>
          )}
          <div className="calendar-task-note"><FiCheckSquare /><div><strong>Scheduled tasks</strong><p>Tasks can be connected here when the shared task store is available.</p></div></div>
          <div className="calendar-subject-note"><FiBookOpen /><span>Events and timetable blocks are managed separately.</span></div>
        </div>
      </section>
    </div>
  )
}

export default CalendarPage
