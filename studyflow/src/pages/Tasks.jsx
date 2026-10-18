import { useEffect, useState } from 'react'
import { tasksAPI, commonTasksAPI } from '../services/api'
import {
  FiCalendar,
  FiPlus,
  FiCheckCircle,
  FiCircle,
  FiRepeat,
  FiChevronLeft,
  FiChevronRight,
  FiList,
} from 'react-icons/fi'

function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function Tasks() {
  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString(new Date()),
  )

  const [dailyTasks, setDailyTasks] = useState([])
  const [commonTasks, setCommonTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [newDailyTask, setNewDailyTask] = useState('')
  const [newCommonTask, setNewCommonTask] = useState('')

  // Completion is stored separately for each date.
  // A common task completed today can be incomplete tomorrow.
  const [commonCompletion, setCommonCompletion] = useState({})

  useEffect(() => {
    let isMounted = true

    async function loadTasks() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const [dailyData, commonData] = await Promise.all([
          tasksAPI.getAll(),
          commonTasksAPI.getAll(),
        ])
        if (!isMounted) return
        setDailyTasks(Array.isArray(dailyData) ? dailyData : [])
        setCommonTasks(Array.isArray(commonData) ? commonData : [])
        const completion = {}
        ;(Array.isArray(commonData) ? commonData : []).forEach((task) => {
          ;(Array.isArray(task.completedDates) ? task.completedDates : []).forEach((date) => {
            completion[`${date}_${task.id}`] = true
          })
        })
        setCommonCompletion(completion)
      } catch (error) {
        if (isMounted) setErrorMessage('Could not load tasks. Make sure JSON Server is running on port 3001.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTasks()
    return () => { isMounted = false }
  }, [])

  const dateObject = new Date(`${selectedDate}T12:00:00`)

  const formattedDate = dateObject.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const changeDate = (amount) => {
    const nextDate = new Date(`${selectedDate}T12:00:00`)
    nextDate.setDate(nextDate.getDate() + amount)
    setSelectedDate(getLocalDateString(nextDate))
  }

  const addDailyTask = async (event) => {
    event.preventDefault()
    const title = newDailyTask.trim()
    if (!title) return
    setErrorMessage('')
    try {
      const created = await tasksAPI.create({ title, date: selectedDate, completed: false })
      setDailyTasks((previous) => [...previous, created])
      setNewDailyTask('')
    } catch (error) {
      setErrorMessage('Could not save this task. Check that JSON Server is running.')
    }
  }

  const addCommonTask = async (event) => {
    event.preventDefault()
    const title = newCommonTask.trim()
    if (!title) return
    setErrorMessage('')
    try {
      const created = await commonTasksAPI.create({ title, completedDates: [] })
      setCommonTasks((previous) => [...previous, created])
      setNewCommonTask('')
    } catch (error) {
      setErrorMessage('Could not save this common task. Check that JSON Server is running.')
    }
  }

  const toggleDailyTask = async (taskId) => {
    const task = dailyTasks.find((item) => item.id === taskId)
    if (!task) return
    const updatedTask = { ...task, completed: !task.completed }
    setErrorMessage('')
    try {
      const saved = await tasksAPI.update(taskId, { completed: updatedTask.completed })
      setDailyTasks((previous) => previous.map((item) => item.id === taskId ? { ...item, ...saved, ...updatedTask } : item))
    } catch (error) {
      setErrorMessage('Could not update the task. Please try again.')
    }
  }

  const toggleCommonTask = async (taskId) => {
    const task = commonTasks.find((item) => item.id === taskId)
    if (!task) return
    const dates = Array.isArray(task.completedDates) ? task.completedDates : []
    const wasCompleted = dates.includes(selectedDate)
    const completedDates = wasCompleted ? dates.filter((date) => date !== selectedDate) : [...dates, selectedDate]
    setErrorMessage('')
    try {
      const saved = await commonTasksAPI.update(taskId, { completedDates })
      setCommonTasks((previous) => previous.map((item) => item.id === taskId ? { ...item, ...saved, completedDates } : item))
      setCommonCompletion((previous) => ({ ...previous, [`${selectedDate}_${taskId}`]: !wasCompleted }))
    } catch (error) {
      setErrorMessage('Could not update the common task. Please try again.')
    }
  }

  const deleteDailyTask = async (taskId) => {
    setErrorMessage('')
    try {
      await tasksAPI.delete(taskId)
      setDailyTasks((previous) => previous.filter((task) => task.id !== taskId))
    } catch (error) {
      setErrorMessage('Could not delete the task. Please try again.')
    }
  }

  const deleteCommonTask = async (taskId) => {
    setErrorMessage('')
    try {
      await commonTasksAPI.delete(taskId)
      setCommonTasks((previous) => previous.filter((task) => task.id !== taskId))
      setCommonCompletion((previous) => {
        const updated = { ...previous }
        Object.keys(updated).forEach((key) => { if (key.endsWith(`_${taskId}`)) delete updated[key] })
        return updated
      })
    } catch (error) {
      setErrorMessage('Could not delete the common task. Please try again.')
    }
  }

  const visibleDailyTasks = dailyTasks.filter(
    (task) => task.date === selectedDate,
  )

  const completedDailyTasks = visibleDailyTasks.filter(
    (task) => task.completed,
  ).length

  const completedCommonTasks = commonTasks.filter(
    (task) => (Array.isArray(task.completedDates) && task.completedDates.includes(selectedDate)) || commonCompletion[`${selectedDate}_${task.id}`],
  ).length

  return (
    <div className="page tasks-page">
      {errorMessage && (
        <div className="task-error-message" role="alert">{errorMessage}</div>
      )}

      {isLoading && (
        <div className="task-loading-message" role="status">Loading your tasks...</div>
      )}

      {/* Page introduction */}
      <section className="page-intro-card">
        <span className="eyebrow">PLAN YOUR DAY</span>

        <h2>One task at a time.</h2>

        <p>
          Organize your daily priorities and build consistent study habits.
        </p>
      </section>

      {/* Date selector */}
      <section className="task-date-bar">
        <div className="task-date-info">
          <div className="task-date-icon">
            <FiCalendar size={21} />
          </div>

          <div>
            <span className="task-date-label">SELECTED DATE</span>
            <h3>{formattedDate}</h3>
          </div>
        </div>

        <div className="date-controls">
          <button
            type="button"
            className="icon-button"
            onClick={() => changeDate(-1)}
            aria-label="Previous day"
            title="Previous day"
          >
            <FiChevronLeft />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            aria-label="Select task date"
          />

          <button
            type="button"
            className="icon-button"
            onClick={() => changeDate(1)}
            aria-label="Next day"
            title="Next day"
          >
            <FiChevronRight />
          </button>

          <button
            type="button"
            className="today-button"
            onClick={() => setSelectedDate(getLocalDateString(new Date()))}
          >
            Today
          </button>
        </div>
      </section>

      {/* Task columns */}
      <section className="tasks-grid">
        {/* Date-specific tasks */}
        <article className="content-card task-section">
          <div className="task-section-heading">
            <div className="task-heading-icon daily-task-icon">
              <FiList size={20} />
            </div>

            <div className="task-heading-text">
              <h3>Daily tasks</h3>
              <p>Tasks for the selected date</p>
            </div>

            <span className="task-count">
              {completedDailyTasks}/{visibleDailyTasks.length}
            </span>
          </div>

          <div className="task-progress-track">
            <div
              className="task-progress-fill"
              style={{
                width: `${
                  visibleDailyTasks.length
                    ? (completedDailyTasks / visibleDailyTasks.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <form className="task-add-form" onSubmit={addDailyTask}>
            <input
              type="text"
              value={newDailyTask}
              onChange={(event) => setNewDailyTask(event.target.value)}
              placeholder="Add a task for this date..."
              aria-label="New daily task"
            />

            <button
              type="submit"
              className="primary-button task-add-button"
              aria-label="Add daily task"
            >
              <FiPlus size={17} />
              Add
            </button>
          </form>

          <div className="task-list">
            {visibleDailyTasks.length === 0 ? (
              <div className="task-empty-state">
                <FiCheckCircle size={27} />

                <h4>No tasks for this date</h4>

                <p>Add a task above to plan your day.</p>
              </div>
            ) : (
              visibleDailyTasks.map((task) => (
                <div
                  className={`task-item ${
                    task.completed ? 'completed' : ''
                  }`}
                  key={task.id}
                >
                  <button
                    type="button"
                    className="task-check"
                    onClick={() => toggleDailyTask(task.id)}
                    aria-label={
                      task.completed
                        ? `Mark ${task.title} incomplete`
                        : `Complete ${task.title}`
                    }
                  >
                    {task.completed ? (
                      <FiCheckCircle size={20} />
                    ) : (
                      <FiCircle size={20} />
                    )}
                  </button>

                  <span className="task-title">{task.title}</span>

                  <button
                    type="button"
                    className="task-delete-button"
                    onClick={() => deleteDailyTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    title="Delete task"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Common tasks */}
        <article className="content-card task-section">
          <div className="task-section-heading">
            <div className="task-heading-icon common-task-icon">
              <FiRepeat size={20} />
            </div>

            <div className="task-heading-text">
              <h3>Common tasks</h3>
              <p>Reusable tasks available every day</p>
            </div>

            <span className="task-count">
              {completedCommonTasks}/{commonTasks.length}
            </span>
          </div>

          <div className="common-task-notice">
            Completion is tracked separately for each date.
          </div>

          <form className="task-add-form" onSubmit={addCommonTask}>
            <input
              type="text"
              value={newCommonTask}
              onChange={(event) => setNewCommonTask(event.target.value)}
              placeholder="Add a recurring task..."
              aria-label="New common task"
            />

            <button
              type="submit"
              className="primary-button task-add-button"
              aria-label="Add common task"
            >
              <FiPlus size={17} />
              Add
            </button>
          </form>

          <div className="task-list">
            {commonTasks.length === 0 ? (
              <div className="task-empty-state">
                <FiRepeat size={27} />

                <h4>No common tasks yet</h4>

                <p>
                  Add routines such as reading, revision, or daily practice.
                </p>
              </div>
            ) : (
              commonTasks.map((task) => {
                const completionKey = `${selectedDate}_${task.id}`
                const completed = (Array.isArray(task.completedDates) && task.completedDates.includes(selectedDate)) || Boolean(commonCompletion[completionKey])

                return (
                  <div
                    className={`task-item ${
                      completed ? 'completed' : ''
                    }`}
                    key={task.id}
                  >
                    <button
                      type="button"
                      className="task-check"
                      onClick={() => toggleCommonTask(task.id)}
                      aria-label={
                        completed
                          ? `Mark ${task.title} incomplete`
                          : `Complete ${task.title}`
                      }
                    >
                      {completed ? (
                        <FiCheckCircle size={20} />
                      ) : (
                        <FiCircle size={20} />
                      )}
                    </button>

                    <span className="task-title">{task.title}</span>

                    <button
                      type="button"
                      className="task-delete-button"
                      onClick={() => deleteCommonTask(task.id)}
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default Tasks