import { useEffect, useMemo, useState } from 'react'
import {
  FiBookOpen, FiPlus, FiSearch, FiFileText, FiTrash2, FiClock,
  FiEdit3, FiFolder, FiCoffee, FiMoreVertical, FiBold, FiItalic,
  FiUnderline, FiList, FiAlignLeft, FiAlignCenter, FiLink, FiImage,
  FiSave, FiChevronDown, FiCornerUpLeft, FiCornerUpRight, FiLayers, FiArrowLeft,
} from 'react-icons/fi'
import { subjectsAPI, notesAPI } from '../services/api'

const subjectIcons = [FiCoffee, FiBookOpen, FiLayers, FiFolder, FiFileText]
const defaultSubjects = [
  { id: 'subject-1', name: 'Java' },
  { id: 'subject-2', name: 'Python' },
  { id: 'subject-3', name: 'Computer Networks' },
  { id: 'subject-4', name: 'DBMS' },
  { id: 'subject-5', name: 'Computer Science' },
]

function Notes() {
  const [subjects, setSubjects] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedNote, setSelectedNote] = useState(null)
  const [subjectInput, setSubjectInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [noteMode, setNoteMode] = useState('read') // 'read' or 'edit'
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadNotesData() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        let [loadedSubjects, loadedNotes] = await Promise.all([
          subjectsAPI.getAll(),
          notesAPI.getAll(),
        ])
        if (!Array.isArray(loadedSubjects)) loadedSubjects = []
        if (!Array.isArray(loadedNotes)) loadedNotes = []

        // Seed the original default subject list only when the database is empty.
        if (loadedSubjects.length === 0) {
          const createdSubjects = await Promise.all(
            defaultSubjects.map((subject) => subjectsAPI.create(subject)),
          )
          loadedSubjects = createdSubjects
        }
        if (cancelled) return
        setSubjects(loadedSubjects)
        setNotes(loadedNotes)
        setSelectedSubject((current) =>
          loadedSubjects.some((subject) => String(subject.id) === String(current))
            ? current
            : String(loadedSubjects[0]?.id ?? ''),
        )
      } catch (error) {
        if (!cancelled) {
          setErrorMessage('Could not load notes. Make sure JSON Server is running on port 3001, then refresh.')
          console.error('Failed to load notes data:', error)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadNotesData()
    return () => { cancelled = true }
  }, [])

  const currentSubject = subjects.find((subject) => String(subject.id) === String(selectedSubject))
  const subjectNotes = useMemo(
    () => notes.filter((note) => String(note.subjectId) === String(selectedSubject)),
    [notes, selectedSubject],
  )
  const filteredNotes = subjectNotes.filter((note) =>
    `${note.title} ${note.content}`.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const activeNote = notes.find((note) => String(note.id) === String(selectedNote))

  const createSubject = async (event) => {
    event.preventDefault()
    const name = subjectInput.trim()
    if (!name) return
    setErrorMessage('')
    try {
      const subject = await subjectsAPI.create({ name })
      setSubjects((previous) => [...previous, subject])
      setSelectedSubject(String(subject.id))
      setSubjectInput('')
      setIsAddingSubject(false)
      setSelectedNote(null)
      setIsCreatingNote(false)
      setNoteMode('read')
      setEditorTitle('')
      setEditorContent('')
    } catch (error) {
      setErrorMessage('Could not add the subject. Check that JSON Server is running.')
      console.error('Failed to create subject:', error)
    }
  }

  const deleteSubject = async (subjectId) => {
    if (!window.confirm('Delete this subject and all its notes?')) return
    setErrorMessage('')
    const subjectNotesToDelete = notes.filter((note) => String(note.subjectId) === String(subjectId))
    try {
      await Promise.all([
        subjectsAPI.delete(subjectId),
        ...subjectNotesToDelete.map((note) => notesAPI.delete(note.id)),
      ])
      setSubjects((previous) => previous.filter((subject) => String(subject.id) !== String(subjectId)))
      setNotes((previous) => previous.filter((note) => String(note.subjectId) !== String(subjectId)))
      if (String(selectedSubject) === String(subjectId)) {
        const nextSubject = subjects.find((subject) => String(subject.id) !== String(subjectId))
        setSelectedSubject(String(nextSubject?.id ?? ''))
        setSelectedNote(null)
        setIsCreatingNote(false)
        setEditorTitle('')
        setEditorContent('')
      }
    } catch (error) {
      setErrorMessage('Could not delete the subject and its notes. Please try again.')
      console.error('Failed to delete subject:', error)
    }
  }

  const openNote = (note) => {
    setSelectedNote(note.id)
    setEditorTitle(note.title)
    setEditorContent(note.content || '')
    setIsCreatingNote(false)
    setNoteMode('read')
  }

  const startEditingNote = () => {
    if (!activeNote) return
    setEditorTitle(activeNote.title || '')
    setEditorContent(activeNote.content || '')
    setNoteMode('edit')
  }

  const cancelEditing = () => {
    if (isCreatingNote) {
      setSelectedNote(null)
      setIsCreatingNote(false)
      setEditorTitle('')
      setEditorContent('')
      setNoteMode('read')
      return
    }
    if (activeNote) {
      setEditorTitle(activeNote.title || '')
      setEditorContent(activeNote.content || '')
    }
    setNoteMode('read')
  }

  const startNewNote = () => {
    if (!selectedSubject) {
      window.alert('Create or select a subject first.')
      return
    }
    setSelectedNote(null)
    setEditorTitle('')
    setEditorContent('')
    setIsCreatingNote(true)
    setNoteMode('edit')
  }

  const saveNote = async () => {
    if (!selectedSubject) return window.alert('Select a subject first.')
    const title = editorTitle.trim()
    if (!title) return window.alert('Please enter a title for your note.')
    const now = new Date().toISOString()
    setIsSaving(true)
    setErrorMessage('')
    try {
      if (isCreatingNote) {
        const newNote = await notesAPI.create({
          subjectId: selectedSubject, title, content: editorContent, updatedAt: now,
        })
        setNotes((previous) => [...previous, newNote])
        setSelectedNote(newNote.id)
        setIsCreatingNote(false)
        setNoteMode('read')
      } else if (selectedNote) {
        const updatedNote = await notesAPI.update(selectedNote, {
          title, content: editorContent, updatedAt: now,
        })
        setNotes((previous) => previous.map((note) =>
          String(note.id) === String(selectedNote)
            ? { ...note, ...updatedNote, title, content: editorContent, updatedAt: now }
            : note,
        ))
        setNoteMode('read')
      }
    } catch (error) {
      setErrorMessage('Could not save this note. Check that JSON Server is running and try again.')
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    setErrorMessage('')
    try {
      await notesAPI.delete(noteId)
      setNotes((previous) => previous.filter((note) => String(note.id) !== String(noteId)))
      setSelectedNote(null)
      setEditorTitle('')
      setEditorContent('')
      setIsCreatingNote(false)
      setNoteMode('read')
    } catch (error) {
      setErrorMessage('Could not delete this note. Please try again.')
      console.error('Failed to delete note:', error)
    }
  }

  const formatDate = (dateString) => dateString
    ? new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'New note'

  const applyFormat = (prefix, suffix = prefix) => {
    const textarea = document.querySelector('.reference-note-content')
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = editorContent.slice(start, end)
    const next = `${editorContent.slice(0, start)}${prefix}${selected || 'text'}${suffix}${editorContent.slice(end)}`
    setEditorContent(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected || 'text').length)
    })
  }

  const hasOpenNote = isCreatingNote || Boolean(selectedNote)
  const isEditing = noteMode === 'edit'

  return (
    <div className="page notes-page reference-notes-page">
      <section className="reference-notes-workspace">
        <aside className="reference-notes-library">
          {(errorMessage || isLoading) && (
            <div role="status" style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', background: errorMessage ? 'rgba(220, 70, 70, 0.12)' : 'rgba(120, 120, 120, 0.10)', color: 'var(--text-primary, inherit)' }}>
              {errorMessage || 'Loading your subjects and notes...'}
            </div>
          )}
          <div className="reference-notes-section-heading">
            <h2>Subjects</h2>
            <button className="primary-button reference-add-button" onClick={() => setIsAddingSubject((value) => !value)} type="button" disabled={isLoading}>
              <FiPlus size={16} /> <span>Add Subject</span>
            </button>
          </div>

          {isAddingSubject && (
            <form className="reference-subject-form" onSubmit={createSubject}>
              <input autoFocus value={subjectInput} onChange={(event) => setSubjectInput(event.target.value)} placeholder="Subject name..." aria-label="New subject name" />
              <button type="submit" className="primary-button">Add</button>
            </form>
          )}

          <div className="reference-subject-list">
            {subjects.map((subject, index) => {
              const SubjectIcon = subjectIcons[index % subjectIcons.length]
              const count = notes.filter((note) => note.subjectId === subject.id).length
              return (
                <div key={subject.id} className={`reference-subject-row ${selectedSubject === subject.id ? 'active' : ''}`}>
                  <button type="button" className="reference-subject-select" onClick={() => {
                    setSelectedSubject(String(subject.id)); setSelectedNote(null); setIsCreatingNote(false); setNoteMode('read')
                    setEditorTitle(''); setEditorContent(''); setSearchQuery('')
                  }}>
                    <SubjectIcon size={22} />
                    <span>{subject.name}</span>
                    <small>{count}</small>
                  </button>
                  <button className="reference-more-button" type="button" aria-label={`Delete ${subject.name}`} title="Delete subject" onClick={() => deleteSubject(subject.id)}>
                    <FiMoreVertical size={17} />
                  </button>
                </div>
              )
            })}
            <button type="button" className="reference-add-subject-link" onClick={() => setIsAddingSubject(true)}>
              <span className="reference-add-circle"><FiPlus size={18} /></span> Add subject
            </button>
          </div>

        </aside>

        {!hasOpenNote ? (
          <section className="reference-note-editor reference-notes-browser">
            <div className="reference-notes-section-heading reference-note-list-heading">
              <div>
                <h2>Notes in {currentSubject?.name || 'Subject'}</h2>
                <p className="reference-notes-subtitle">{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} available</p>
              </div>
              <button className="primary-button reference-add-button" onClick={startNewNote} type="button" disabled={!selectedSubject || isLoading}>
                <FiPlus size={16} /> <span>Add Note</span>
              </button>
            </div>
            <label className="reference-notes-search">
              <FiSearch size={16} />
              <input type="search" placeholder="Search notes..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Search notes" />
            </label>
            <div className="reference-note-list reference-note-list-main">
              {filteredNotes.length === 0 ? (
                <div className="reference-notes-empty-list">
                  <FiFileText size={28} />
                  <p>{searchQuery ? 'No matching notes.' : `No notes in ${currentSubject?.name || 'this subject'} yet.`}</p>
                  {!searchQuery && <button type="button" className="primary-button" onClick={startNewNote}><FiPlus size={16} /> Add your first note</button>}
                </div>
              ) : filteredNotes.map((note) => (
                <button type="button" key={note.id} className="reference-note-row" onClick={() => openNote(note)}>
                  <FiFileText className="reference-note-row-icon" size={21} />
                  <span className="reference-note-row-copy">
                    <strong>{note.title}</strong>
                    <small>{formatDate(note.updatedAt)}</small>
                    {note.content && <span className="reference-note-preview">{note.content.slice(0, 140)}{note.content.length > 140 ? '…' : ''}</span>}
                  </span>
                  <span className="reference-note-open-label">Read note →</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
        <section className={`reference-note-editor ${isEditing ? 'is-editing' : 'is-reading'}`}>
          {hasOpenNote ? (
            <>
              <div className="reference-editor-topline">
                {!isEditing && (
                  <button type="button" className="secondary-button reference-save-button" onClick={() => { setSelectedNote(null); setIsCreatingNote(false); setNoteMode('read'); setEditorTitle(''); setEditorContent('') }}>
                    <FiArrowLeft size={16} /> Back to notes
                  </button>
                )}
                {isEditing ? (
                  <input className="reference-note-title" value={editorTitle} onChange={(event) => setEditorTitle(event.target.value)} placeholder="Untitled note" aria-label="Note title" />
                ) : (
                  <h1 className="reference-note-title reference-note-title-display" style={{ display: 'flex', alignItems: 'center', margin: 0, border: 'none', background: 'transparent', paddingLeft: 0 }}>{activeNote?.title || editorTitle || 'Untitled note'}</h1>
                )}
                {isEditing ? (
                  <>
                    <button className="secondary-button reference-save-button" onClick={cancelEditing} type="button" disabled={isSaving}>Cancel</button>
                    <button className="primary-button reference-save-button" onClick={saveNote} type="button" disabled={isSaving || isLoading}><FiSave size={16} /> {isSaving ? 'Saving...' : 'Save note'}</button>
                  </>
                ) : (
                  <button className="primary-button reference-save-button" onClick={startEditingNote} type="button" disabled={!activeNote}><FiEdit3 size={16} /> Edit note</button>
                )}
                {selectedNote && <button className="reference-more-button editor-more" type="button" title="Delete note" onClick={() => deleteNote(selectedNote)}><FiTrash2 size={18} /></button>}
              </div>

              {isEditing && (
                <div className="reference-format-toolbar" aria-label="Formatting toolbar">
                  <button type="button" title="Undo" onClick={() => {}}><FiCornerUpLeft /></button>
                  <button type="button" title="Redo" onClick={() => {}}><FiCornerUpRight /></button>
                  <span className="reference-toolbar-separator" />
                  <button type="button" className="reference-format-select" onClick={() => applyFormat('## ', '')}>Normal text <FiChevronDown size={13} /></button>
                  <button type="button" title="Bold" onClick={() => applyFormat('**')}><FiBold /></button>
                  <button type="button" title="Italic" onClick={() => applyFormat('*')}><FiItalic /></button>
                  <button type="button" title="Underline" onClick={() => applyFormat('__')}><FiUnderline /></button>
                  <span className="reference-toolbar-separator" />
                  <button type="button" title="Bulleted list" onClick={() => setEditorContent((content) => `${content}\n• `)}><FiList /></button>
                  <button type="button" title="Numbered list" onClick={() => setEditorContent((content) => `${content}\n1. `)}><FiAlignLeft /></button>
                  <button type="button" title="Center align"><FiAlignCenter /></button>
                  <button type="button" title="Insert link" onClick={() => applyFormat('[', '](url)')}><FiLink /></button>
                  <button type="button" title="Insert image" onClick={() => setEditorContent((content) => `${content}\n[Image description]`)}><FiImage /></button>
                </div>
              )}

              <div className="reference-editor-meta"><FiFolder size={14} /> {currentSubject?.name || 'No subject'} <span>•</span> {activeNote ? `Last edited ${formatDate(activeNote.updatedAt)}` : 'New note'}</div>
              {isEditing ? (
                <textarea className="reference-note-content" value={editorContent} onChange={(event) => setEditorContent(event.target.value)} placeholder={'Start writing your notes here...\n\nCapture definitions, key concepts, examples, and important points for quick revision.'} aria-label="Note content" autoFocus />
              ) : (
                <article className="reference-note-content reference-note-content-readonly" style={{ resize: 'none', overflowY: 'auto', cursor: 'default' }} aria-label="Note content">
                  {activeNote?.content?.trim() ? activeNote.content : <span className="reference-note-empty-content">This note is empty. Choose Edit note to add content.</span>}
                </article>
              )}
              <div className="reference-editor-footer">
                <span><FiClock size={14} /> {(isEditing ? editorContent : (activeNote?.content || editorContent)).length} characters</span>
                {selectedNote && isEditing && <button type="button" className="danger-button button-small" onClick={() => deleteNote(selectedNote)}><FiTrash2 size={14} /> Delete note</button>}
              </div>
            </>
          ) : null}
        </section>
        )}

      </section>
    </div>
  )
}

export default Notes
