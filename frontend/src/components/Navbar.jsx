import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span
            onClick={() => navigate('/')}
            className="font-semibold text-gray-900 cursor-pointer select-none"
          >
            TaskFlow
          </span>
          <nav className="flex gap-1">
            <button
              onClick={() => navigate('/')}
              className={`text-sm px-3 py-1.5 rounded-lg transition ${
                location.pathname === '/'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Tareas
            </button>
            <button
              onClick={() => navigate('/teams')}
              className={`text-sm px-3 py-1.5 rounded-lg transition ${
                location.pathname === '/teams'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Equipos
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-gray-500">{user.username || user.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
