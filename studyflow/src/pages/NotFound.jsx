import { Link } from 'react-router-dom'
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi'

function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">
          <FiAlertCircle size={32} />
        </div>

        <span className="eyebrow">PAGE NOT FOUND</span>

        <h2>Looks like you're lost.</h2>

        <p>
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back to your study space.
        </p>

        <Link to="/" className="primary-button">
          <FiArrowLeft size={17} />
          Back to dashboard
        </Link>

        <span className="not-found-code">ERROR 404</span>
      </div>
    </div>
  )
}

export default NotFound