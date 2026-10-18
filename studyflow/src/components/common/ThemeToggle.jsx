import { useDispatch, useSelector } from 'react-redux'
import { FiMoon, FiSun } from 'react-icons/fi'
import { toggleTheme } from '../../features/theme/themeSlice'

function ThemeToggle() {
  const dispatch = useDispatch()
  const mode = useSelector((state) => state.theme.mode)

  const handleToggle = () => {
    dispatch(toggleTheme())
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggle}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode === 'light' ? <FiMoon size={19} /> : <FiSun size={19} />}
    </button>
  )
}

export default ThemeToggle