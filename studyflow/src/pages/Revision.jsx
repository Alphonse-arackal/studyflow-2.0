import { useEffect, useMemo, useState } from 'react'
import {
  FiLayers,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiHelpCircle,
  FiBookOpen,
  FiTarget,
  FiTrash2,
  FiRotateCcw,
  FiEye,
  FiFileText,
} from 'react-icons/fi'
import { subjectsAPI, flashcardsAPI, mockTestsAPI } from '../services/api'

function Revision() {
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [mockTests, setMockTests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [questionInput, setQuestionInput] = useState('')
  const [answerInput, setAnswerInput] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [testTitleInput, setTestTitleInput] = useState('')

  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [showTestForm, setShowTestForm] = useState(false)

  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  // Store review history by flashcard ID.
  const reviewStatus = Object.fromEntries(flashcards.filter((card) => card.reviewStatus).map((card) => [card.id, card.reviewStatus]))

  useEffect(() => {
    let cancelled = false
    async function loadRevisionData() {
      setIsLoading(true)
      setErrorMessage('')
      try {
        let [loadedSubjects, loadedCards, loadedTests] = await Promise.all([
          subjectsAPI.getAll(), flashcardsAPI.getAll(), mockTestsAPI.getAll(),
        ])
        if (!Array.isArray(loadedSubjects)) loadedSubjects = []
        if (!Array.isArray(loadedCards)) loadedCards = []
        if (!Array.isArray(loadedTests)) loadedTests = []
        if (loadedSubjects.length === 0) {
          loadedSubjects = await Promise.all([
            subjectsAPI.create({ name: 'Computer Science' }),
            subjectsAPI.create({ name: 'Database Management' }),
          ])
        }
        if (cancelled) return
        setSubjects(loadedSubjects)
        setFlashcards(loadedCards)
        setMockTests(loadedTests)
        setSelectedSubject((current) => loadedSubjects.some((subject) => String(subject.id) === String(current)) ? current : String(loadedSubjects[0]?.id ?? ''))
      } catch (error) {
        if (!cancelled) setErrorMessage('Could not load revision data. Make sure JSON Server is running on port 3001, then refresh.')
        console.error('Failed to load revision data:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadRevisionData()
    return () => { cancelled = true }
  }, [])

  // The Notes page shares the same subjects collection. Keep duplicate database
  // records intact, but show each subject name only once in the Revision UI.
  const uniqueSubjects = useMemo(() => {
    const seen = new Set()
    return subjects.filter((subject) => {
      const key = String(subject.name || '').trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [subjects])

  const currentSubject = subjects.find(
    (subject) => String(subject.id) === String(selectedSubject),
  )

  const subjectCards = useMemo(
    () =>
      flashcards.filter(
        (card) => String(card.subjectId) === String(selectedSubject),
      ),
    [flashcards, selectedSubject],
  )

  const subjectTests = mockTests.filter(
    (test) => String(test.subjectId) === String(selectedSubject),
  )

  const activeCard = subjectCards[activeCardIndex]

  const knownCount = subjectCards.filter(
    (card) => reviewStatus[card.id] === 'known',
  ).length

  const unsureCount = subjectCards.filter(
    (card) => reviewStatus[card.id] === 'unsure',
  ).length

  const reviewedCount = knownCount + unsureCount

  const reviewPercentage = subjectCards.length
    ? Math.round((reviewedCount / subjectCards.length) * 100)
    : 0

  const addSubject = async (event) => {
    event.preventDefault()
    const name = subjectInput.trim()
    if (!name) return
    if (subjects.some((subject) => String(subject.name || '').trim().toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A subject with this name already exists.')
      return
    }
    setErrorMessage('')
    try {
      const subject = await subjectsAPI.create({ name })
      setSubjects((previous) => [...previous, subject])
      setSelectedSubject(String(subject.id))
      setSubjectInput('')
      setShowSubjectForm(false)
      setActiveCardIndex(0)
      setShowAnswer(false)
    } catch (error) {
      setErrorMessage('Could not add subject. Check that JSON Server is running.')
      console.error(error)
    }
  }

  const addFlashcard = async (event) => {
    event.preventDefault()
    const question = questionInput.trim()
    const answer = answerInput.trim()
    if (!question || !answer || !selectedSubject) return
    setErrorMessage('')
    try {
      const card = await flashcardsAPI.create({
        subjectId: selectedSubject, question, answer,
        createdAt: new Date().toISOString(), reviewStatus: '',
      })
      setFlashcards((previous) => [...previous, card])
      setQuestionInput('')
      setAnswerInput('')
      setShowCardForm(false)
      setActiveCardIndex(subjectCards.length)
      setShowAnswer(false)
    } catch (error) {
      setErrorMessage('Could not save flashcard. Check that JSON Server is running.')
      console.error(error)
    }
  }

  const deleteFlashcard = async (cardId) => {
    setErrorMessage('')
    try {
      await flashcardsAPI.delete(cardId)
      setFlashcards((previous) => previous.filter((card) => String(card.id) !== String(cardId)))
      setActiveCardIndex((previous) => Math.max(0, Math.min(previous, subjectCards.length - 2)))
      setShowAnswer(false)
    } catch (error) {
      setErrorMessage('Could not delete flashcard. Please try again.')
      console.error(error)
    }
  }

  const changeSubject = (subjectId) => {
    setSelectedSubject(subjectId)
    setActiveCardIndex(0)
    setShowAnswer(false)
    setShowCardForm(false)
    setShowTestForm(false)
  }

  const changeCard = (direction) => {
    if (!subjectCards.length) return

    setActiveCardIndex((previous) => {
      const next = previous + direction

      if (next < 0) return subjectCards.length - 1
      if (next >= subjectCards.length) return 0

      return next
    })

    setShowAnswer(false)
  }

  const markCard = async (status) => {
    if (!activeCard) return
    setErrorMessage('')
    try {
      const updatedCard = await flashcardsAPI.update(activeCard.id, { reviewStatus: status })
      setFlashcards((previous) => previous.map((card) => String(card.id) === String(activeCard.id) ? { ...card, ...updatedCard, reviewStatus: status } : card))
      setShowAnswer(false)
      if (activeCardIndex < subjectCards.length - 1) setActiveCardIndex((previous) => previous + 1)
    } catch (error) {
      setErrorMessage('Could not save review progress. Please try again.')
      console.error(error)
    }
  }

  const resetProgress = async () => {
    if (!window.confirm('Reset the review progress for this subject?')) return
    setErrorMessage('')
    try {
      await Promise.all(subjectCards.map((card) => flashcardsAPI.update(card.id, { reviewStatus: '' })))
      setFlashcards((previous) => previous.map((card) => String(card.subjectId) === String(selectedSubject) ? { ...card, reviewStatus: '' } : card))
      setActiveCardIndex(0)
      setShowAnswer(false)
    } catch (error) {
      setErrorMessage('Could not reset review progress. Please try again.')
      console.error(error)
    }
  }

  const addMockTest = async (event) => {
    event.preventDefault()
    const title = testTitleInput.trim()
    if (!title || !selectedSubject) return
    setErrorMessage('')
    try {
      const test = await mockTestsAPI.create({ subjectId: selectedSubject, title, createdAt: new Date().toISOString() })
      setMockTests((previous) => [...previous, test])
      setTestTitleInput('')
      setShowTestForm(false)
    } catch (error) {
      setErrorMessage('Could not save mock test. Please try again.')
      console.error(error)
    }
  }

  const deleteMockTest = async (testId) => {
    setErrorMessage('')
    try {
      await mockTestsAPI.delete(testId)
      setMockTests((previous) => previous.filter((test) => String(test.id) !== String(testId)))
    } catch (error) {
      setErrorMessage('Could not delete mock test. Please try again.')
      console.error(error)
    }
  }

  return (
    <div className="page revision-page revision-reference">
      {(isLoading || errorMessage) && (
        <div role="status" style={{ padding: '10px 14px', marginBottom: 12, borderRadius: 10, background: errorMessage ? 'rgba(220,70,70,.12)' : 'rgba(120,120,120,.1)' }}>
          {errorMessage || 'Loading revision data...'}
        </div>
      )}
      <header className="revision-reference-heading">
        <div>
          <h1>Revision</h1>
          <p>Practice with flashcards and strengthen your concepts.</p>
        </div>
      </header>

      <section className="revision-subject-tabs" aria-label="Subjects">
        {uniqueSubjects.map((subject, index) => {
          const count = flashcards.filter((card) => String(card.subjectId) === String(subject.id)).length
          return (
            <button
              key={subject.id}
              type="button"
              className={`revision-subject-tab ${selectedSubject === subject.id ? 'active' : ''}`}
              onClick={() => changeSubject(subject.id)}
            >
              {index % 4 === 0 ? <FiLayers size={20} /> : index % 4 === 1 ? <FiBookOpen size={20} /> : index % 4 === 2 ? <FiLayers size={20} /> : <FiTarget size={20} />}
              <span>{subject.name}</span>
              <small>{count}</small>
            </button>
          )
        })}
        <button
          type="button"
          className="revision-add-subject-tab"
          onClick={() => setShowSubjectForm((previous) => !previous)}
          aria-label="Add subject"
          title="Add subject"
        >
          <FiPlus size={20} />
        </button>
      </section>

      {showSubjectForm && (
        <form className="revision-inline-subject-form" onSubmit={addSubject}>
          <input
            type="text"
            value={subjectInput}
            onChange={(event) => setSubjectInput(event.target.value)}
            placeholder="Enter subject name..."
            aria-label="New subject name"
            autoFocus
            required
          />
          <button type="submit" className="primary-button">Add subject</button>
        </form>
      )}

      <div className="revision-practice-toolbar">
        <button
          type="button"
          className="primary-button revision-add-card-button"
          onClick={() => setShowCardForm((previous) => !previous)}
          disabled={!selectedSubject || isLoading}
        >
          <FiPlus size={19} /> Add card
        </button>

        <div className="revision-practice-progress">
          <button
            type="button"
            className={`revision-practice-mode ${showAnswer ? 'active' : ''}`}
            onClick={() => setShowAnswer((previous) => !previous)}
            disabled={!activeCard || isLoading}
          >
            <FiEye size={17} /> Practice mode
          </button>
          <div className="revision-progress-summary">
            <strong>{subjectCards.length ? activeCardIndex + 1 : 0} / {subjectCards.length} cards</strong>
            <div className="revision-reference-progress-track">
              <span style={{ width: `${subjectCards.length ? ((activeCardIndex + 1) / subjectCards.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {showCardForm && (
        <form className="revision-reference-create-form" onSubmit={addFlashcard}>
          <label>
            Question
            <textarea value={questionInput} onChange={(event) => setQuestionInput(event.target.value)} placeholder="Enter the question..." rows={2} required />
          </label>
          <label>
            Answer
            <textarea value={answerInput} onChange={(event) => setAnswerInput(event.target.value)} placeholder="Enter the answer..." rows={3} required />
          </label>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => setShowCardForm(false)}>Cancel</button>
            <button type="submit" className="primary-button">Save card</button>
          </div>
        </form>
      )}

      {subjectCards.length === 0 ? (
        <section className="content-card revision-reference-empty">
          <div className="revision-reference-empty-icon"><FiLayers size={28} /></div>
          <h3>No flashcards yet</h3>
          <p>Create your first card for {currentSubject?.name || 'this subject'} to start practising.</p>
          <button type="button" className="primary-button" onClick={() => setShowCardForm(true)}><FiPlus size={17} /> Create first card</button>
        </section>
      ) : (
        <section className="revision-reference-workspace">
          <article className="content-card revision-reference-answer-panel">
            <div className="revision-reference-card-topline">
              <span><FiFileText size={18} /> CARD {activeCardIndex + 1}</span>
              <div className="revision-reference-nav">
                <button type="button" className="icon-button" onClick={() => changeCard(-1)} aria-label="Previous card"><FiChevronLeft /></button>
                <button type="button" className="icon-button" onClick={() => changeCard(1)} aria-label="Next card"><FiChevronRight /></button>
              </div>
            </div>
            <div className="revision-reference-answer-box">
              <h3>Answer</h3>
              {showAnswer ? (
                <p className="revision-reference-answer-text">{activeCard.answer}</p>
              ) : (
                <div className="revision-reference-hidden-answer">
                  <FiEye size={21} />
                  <p>Try answering the question first, then reveal the answer.</p>
                  <button type="button" className="secondary-button" onClick={() => setShowAnswer(true)}>Reveal answer</button>
                </div>
              )}
              <div className="revision-reference-key-points">
                <h4>Review status</h4>
                <p>
                  {reviewStatus[activeCard.id] === 'known'
                    ? '✓ You marked this card as known.'
                    : reviewStatus[activeCard.id] === 'unsure'
                      ? '• This card needs another review.'
                      : '• This card has not been reviewed yet.'}
                </p>
              </div>
              <div className="revision-reference-answer-footer">
                <span>{currentSubject?.name || 'Current subject'}</span>
                <button type="button" className="editor-delete-button" onClick={() => deleteFlashcard(activeCard.id)}><FiTrash2 size={15} /> Delete</button>
              </div>
            </div>
          </article>

          <div className="revision-reference-question-column">
            <article className="content-card revision-reference-question-card">
              <div className="revision-reference-question-topline">
                <span className="revision-reference-question-label"><FiHelpCircle size={17} /> Question</span>
                <span className="revision-reference-card-status">{reviewStatus[activeCard.id] === 'known' ? 'Known' : reviewStatus[activeCard.id] === 'unsure' ? 'Review again' : 'Not reviewed'}</span>
              </div>
              <div className="revision-reference-question-content">
                <h2>{activeCard.question}</h2>
              </div>
            </article>

            <div className="revision-reference-actions">
              <button type="button" className="revision-reference-action unsure" onClick={() => markCard('unsure')}><FiHelpCircle size={19} /> Not sure</button>
              <button type="button" className="revision-reference-action next" onClick={() => changeCard(1)}>Next card <FiChevronRight size={20} /></button>
              <button type="button" className="revision-reference-action known" onClick={() => markCard('known')}><FiCheckCircle size={19} /> Know it</button>
            </div>

            <div className="revision-reference-mini-progress">
              <div><span>Cards reviewed</span><strong>{reviewedCount} / {subjectCards.length}</strong></div>
              <div className="revision-reference-progress-track"><span style={{ width: `${reviewPercentage}%` }} /></div>
              <button type="button" className="text-button" onClick={resetProgress}><FiRotateCcw size={14} /> Reset progress</button>
            </div>
          </div>
        </section>
      )}

      <section className="content-card revision-reference-tests">
        <div className="revision-reference-tests-heading">
          <div>
            <h3>Mock tests</h3>
            <p>Keep practice tests organized by subject.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => setShowTestForm((previous) => !previous)} disabled={!selectedSubject || isLoading}><FiPlus size={16} /> Add test</button>
        </div>
        {showTestForm && (
          <form className="revision-add-form" onSubmit={addMockTest}>
            <input type="text" value={testTitleInput} onChange={(event) => setTestTitleInput(event.target.value)} placeholder="Enter mock test title..." aria-label="Mock test title" required />
            <button type="submit" className="primary-button">Add test</button>
          </form>
        )}
        <div className="mock-test-list">
          {subjectTests.length === 0 ? (
            <div className="revision-empty-state compact"><div className="revision-empty-icon"><FiFileText size={24} /></div><h4>No mock tests added</h4><p>Add a test title to organize your practice sessions.</p></div>
          ) : subjectTests.map((test) => (
            <div className="mock-test-item" key={test.id}>
              <div className="mock-test-icon"><FiFileText size={20} /></div>
              <div className="mock-test-details"><strong>{test.title}</strong><span>{currentSubject?.name}</span></div>
              <span className="mock-test-status">Planned</span>
              <button type="button" className="task-delete-button" aria-label={`Delete ${test.title}`} onClick={() => deleteMockTest(test.id)}>×</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Revision