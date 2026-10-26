
import { Link } from 'react-router-dom'
import {
  FiArrowRight, FiCheckCircle, FiClock, FiCalendar, FiBookOpen,
  FiLayers, FiTarget, FiZap, FiCheck, FiPlay, FiMenu,
} from 'react-icons/fi'
import { useState } from 'react'
import '../styles/landing.css'

const features = [
  { icon: FiCheckCircle, number: '01', title: 'Tasks that move you forward', text: 'Break big goals into manageable tasks, set deadlines, and keep track of what is done.' },
  { icon: FiBookOpen, number: '02', title: 'Notes, neatly organised', text: 'Keep your study notes in one place, ready to revisit whenever you need them.' },
  { icon: FiLayers, number: '03', title: 'Revision that sticks', text: 'Use flashcards and practice tools to make revision more active and intentional.' },
  { icon: FiCalendar, number: '04', title: 'A clearer study schedule', text: 'See upcoming dates and plan your study time without losing sight of priorities.' },
  { icon: FiClock, number: '05', title: 'Focus on one thing', text: 'Use a focused timer to give your attention a clear start and finish.' },
  { icon: FiTarget, number: '06', title: 'Progress you can see', text: 'Bring tasks and study routines together so it is easier to understand how you are doing.' },
]

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand" aria-label="StudyFlow home">
          <span className="landing-brand-mark">S</span>
          <span>StudyFlow<span className="brand-period">.</span></span>
        </Link>
        <button className="landing-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          <FiMenu />
        </button>
        <nav className={`landing-nav-links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a>
          <Link to="/dashboard" className="landing-nav-cta">Open StudyFlow <FiArrowRight /></Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="kicker-dot" /> YOUR STUDY SPACE, REIMAGINED</div>
          <h1>Make room for<br /><span>your best work.</span></h1>
          <p className="hero-description">A calmer way to plan your studies, organise your notes, and stay focused on what matters next.</p>
          <div className="hero-actions">
            <Link to="/dashboard" className="landing-button landing-button-primary">Get started <FiArrowRight /></Link>
            <a href="#features" className="landing-button landing-button-secondary"><FiPlay /> Explore features</a>
          </div>
          <div className="hero-note"><span className="hero-note-icon"><FiCheck /></span> One workspace for your everyday learning</div>
        </div>

        <div className="hero-visual" aria-label="Preview of the StudyFlow study dashboard">
          <div className="visual-glow" />
          <div className="preview-window">
            <div className="preview-topbar">
              <div className="preview-brand"><span>S</span> StudyFlow</div>
              <div className="preview-top-right"><span className="preview-live-dot" /> YOUR WORKSPACE</div>
            </div>
            <div className="preview-content">
              <div className="preview-greeting">
                <div><span className="preview-eyebrow">MONDAY · YOUR PLAN</span><h3>Make today count.</h3><p>A little progress adds up.</p></div>
                <div className="preview-day-icon"><FiTarget /></div>
              </div>
              <div className="preview-stats">
                <div className="preview-stat"><span className="preview-stat-icon green"><FiCheckCircle /></span><span className="preview-stat-label">Tasks done</span><strong>08 <small>/ 12</small></strong><div className="mini-progress"><i style={{ width: '66%' }} /></div></div>
                <div className="preview-stat"><span className="preview-stat-icon amber"><FiClock /></span><span className="preview-stat-label">Focus time</span><strong>2h 40m</strong><div className="mini-progress amber-progress"><i style={{ width: '54%' }} /></div></div>
              </div>
              <div className="preview-lower">
                <div className="preview-task-panel">
                  <div className="preview-panel-heading"><strong>Today's priorities</strong><span>VIEW ALL ↗</span></div>
                  <div className="preview-task done"><span className="task-check"><FiCheck /></span><span><b>Review database notes</b><small>Database Management</small></span><em>Done</em></div>
                  <div className="preview-task"><span className="task-check" /><span><b>Practise React hooks</b><small>Web Development</small></span><em className="task-now">Next</em></div>
                  <div className="preview-task"><span className="task-check" /><span><b>Prepare for the quiz</b><small>Operating Systems</small></span><em>Later</em></div>
                </div>
                <div className="preview-focus-panel"><span className="focus-overline">FOCUS SESSION</span><div className="focus-ring"><div><strong>25:00</strong><small>MINUTES</small></div></div><span className="focus-caption">One thing at a time.</span><span className="focus-play"><FiPlay fill="currentColor" /> Start focus</span></div>
              </div>
              <div className="preview-bottom-line"><span><FiCalendar /> Your week, in view</span><span>STAY IN FLOW <FiArrowRight /></span></div>
            </div>
          </div>
          <div className="floating-chip chip-top"><span className="chip-check"><FiCheck /></span><span><b>Small wins matter</b><small>Keep your momentum</small></span></div>
          <div className="floating-chip chip-bottom"><span className="chip-time"><FiZap /></span><span><b>Focus mode</b><small>Less distraction, more progress</small></span></div>
        </div>
      </section>

      <section className="landing-trust-strip">
        <span>DESIGNED FOR THE WAY YOU STUDY</span>
        <div><FiCheckCircle /> Plan with purpose</div><div><FiBookOpen /> Learn in one place</div><div><FiZap /> Focus on progress</div>
      </section>

      <section className="landing-features" id="features">
        <div className="section-intro">
          <span className="landing-eyebrow">YOUR STUDY TOOLKIT</span>
          <h2>Everything in its place.<br /><span>More space to think.</span></h2>
          <p>Less time switching between tools. More time learning, practising, and making progress.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, number, title, text }) => (
            <article className="feature-card" key={number}>
              <div className="feature-card-top"><span className="feature-icon"><Icon /></span><span className="feature-number">{number}</span></div>
              <h3>{title}</h3><p>{text}</p><span className="feature-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="workflow-copy">
          <span className="landing-eyebrow">A SIMPLE ROUTINE</span>
          <h2>From “I should study”<br />to <span>“I got it done.”</span></h2>
          <p>StudyFlow gives your learning a practical rhythm. Start with a plan, focus on the next step, and review your progress as you go.</p>
          <Link to="/dashboard" className="landing-button landing-button-primary">Build your flow <FiArrowRight /></Link>
        </div>
        <div className="workflow-steps">
          <div className="workflow-step"><span className="workflow-step-number">01</span><div><h3>Plan your priorities</h3><p>Add tasks, deadlines, and the subjects you need to cover.</p></div><FiCheckCircle /></div>
          <div className="workflow-step"><span className="workflow-step-number">02</span><div><h3>Get into focus</h3><p>Choose one task and give it a dedicated focus session.</p></div><FiClock /></div>
          <div className="workflow-step"><span className="workflow-step-number">03</span><div><h3>Review and improve</h3><p>Track what you finish and keep your notes and revision close.</p></div><FiTarget /></div>
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="cta-orb cta-orb-one" /><div className="cta-orb cta-orb-two" />
        <span className="landing-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2>Make your study time<br />work for <span>you.</span></h2>
        <p>Bring a little more clarity to every study session.</p>
        <Link to="/dashboard" className="landing-button landing-button-light">Open StudyFlow <FiArrowRight /></Link>
      </section>

      <footer className="landing-footer">
        <Link to="/" className="landing-brand"><span className="landing-brand-mark">S</span><span>StudyFlow<span className="brand-period">.</span></span></Link>
        <p>Plan better. Focus deeper. Keep moving.</p>
        <span>© {new Date().getFullYear()} StudyFlow</span>
      </footer>
    </main>
  )
}

export default LandingPage
