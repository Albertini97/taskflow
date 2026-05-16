import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  const navLink = (path, label) => (
    <button
      onClick={() => navigate(path)}
      style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: '0.02em',
        padding: '6px 14px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: location.pathname === path ? 'rgba(124,109,250,0.15)' : 'transparent',
        color: location.pathname === path ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  )

  return (
    <header style={{
      background: 'rgba(10,10,15,0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--text)', cursor: 'pointer', letterSpacing: '-0.02em' }} onClick={() => navigate('/')}>
            Task<span style={{ color: 'var(--accent)' }}>Flow</span>
          </span>
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 12px' }} />
          <nav style={{ display: 'flex', gap: 4 }}>
            {navLink('/', 'Tareas')}
            {navLink('/teams', 'Equipos')}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'DM Sans' }}>
              {user.username || user.email}
            </span>
          )}
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
