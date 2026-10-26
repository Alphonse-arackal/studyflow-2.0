import { NavLink } from 'react-router-dom'

import {
  FiGrid,
  FiCheckSquare,
  FiBookOpen,
  FiLayers,
  FiCalendar,
  FiClock,
} from 'react-icons/fi'

const navigation = [
  {
    title: 'Workspace',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
      { name: 'Tasks', path: '/tasks', icon: FiCheckSquare },
      { name: 'Notes', path: '/notes', icon: FiBookOpen },
      { name: 'Revision', path: '/revision', icon: FiLayers },
      { name: 'Calendar', path: '/calendar', icon: FiCalendar },
    ],
  },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">S</div>
        <div className="brand-details">
          <h2>StudyFlow</h2>
          <span>STUDY SMARTER</span>
        </div>
      </div>

      <div className="sidebar-content">
        {navigation.map((section) => (
          <div className="nav-section" key={section.title}>
            <p className="nav-section-title">{section.title}</p>
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="focus-card">
          <div className="focus-icon">
            <FiClock size={20} />
          </div>
          <h4>Stay focused</h4>
          <p>Small steps lead to big results. Keep moving towards your goals.</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
