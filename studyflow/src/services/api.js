// ========================================
// STUDYFLOW API SERVICE
// ========================================

const API_BASE_URL = 'https://studyflow-2-0-jojd.onrender.com'

// ========================================
// GENERIC API HELPERS
// ========================================

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    )
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type')

  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }

  return null
}

function getAll(endpoint) {
  return request(endpoint)
}

function getById(endpoint, id) {
  return request(`${endpoint}/${encodeURIComponent(id)}`)
}

function createItem(endpoint, data) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

function updateItem(endpoint, id, data) {
  return request(`${endpoint}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

function deleteItem(endpoint, id) {
  return request(`${endpoint}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// ========================================
// TASKS API
// ========================================

export const tasksAPI = {
  getAll: () => getAll('/tasks'),
  getById: (id) => getById('/tasks', id),
  create: (task) => createItem('/tasks', task),
  update: (id, task) => updateItem('/tasks', id, task),
  delete: (id) => deleteItem('/tasks', id),
}

// ========================================
// COMMON TASKS API
// ========================================

export const commonTasksAPI = {
  getAll: () => getAll('/commonTasks'),
  getById: (id) => getById('/commonTasks', id),
  create: (task) => createItem('/commonTasks', task),
  update: (id, task) => updateItem('/commonTasks', id, task),
  delete: (id) => deleteItem('/commonTasks', id),
}

// ========================================
// SUBJECTS API
// ========================================

export const subjectsAPI = {
  getAll: () => getAll('/subjects'),
  getById: (id) => getById('/subjects', id),
  create: (subject) => createItem('/subjects', subject),
  update: (id, subject) => updateItem('/subjects', id, subject),
  delete: (id) => deleteItem('/subjects', id),
}

// ========================================
// NOTES API
// ========================================

export const notesAPI = {
  getAll: () => getAll('/notes'),
  getById: (id) => getById('/notes', id),
  create: (note) => createItem('/notes', note),
  update: (id, note) => updateItem('/notes', id, note),
  delete: (id) => deleteItem('/notes', id),
}

// ========================================
// FLASHCARDS API
// ========================================

export const flashcardsAPI = {
  getAll: () => getAll('/flashcards'),
  getById: (id) => getById('/flashcards', id),
  create: (flashcard) => createItem('/flashcards', flashcard),
  update: (id, flashcard) => updateItem('/flashcards', id, flashcard),
  delete: (id) => deleteItem('/flashcards', id),
}

// ========================================
// MOCK TESTS API
// ========================================

export const mockTestsAPI = {
  getAll: () => getAll('/mockTests'),
  getById: (id) => getById('/mockTests', id),
  create: (test) => createItem('/mockTests', test),
  update: (id, test) => updateItem('/mockTests', id, test),
  delete: (id) => deleteItem('/mockTests', id),
}

// ========================================
// CALENDAR EVENTS API
// ========================================

export const eventsAPI = {
  getAll: () => getAll('/events'),
  getById: (id) => getById('/events', id),
  create: (event) => createItem('/events', event),
  update: (id, event) => updateItem('/events', id, event),
  delete: (id) => deleteItem('/events', id),
}

// ========================================
// TIMETABLE API
// ========================================

export const timetableAPI = {
  getAll: () => getAll('/timetableBlocks'),
  getById: (id) => getById('/timetableBlocks', id),
  create: (block) => createItem('/timetableBlocks', block),
  update: (id, block) => updateItem('/timetableBlocks', id, block),
  delete: (id) => deleteItem('/timetableBlocks', id),
}