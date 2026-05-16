import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      const { data: me } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      login(me, data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,109,250,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Task<span style={{ color: 'var(--accent)' }}>Flow</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Bienvenido de vuelta</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && (
            <div className="animate-fade-in" style={{ background: 'rgba(250,77,109,0.08)', border: '1px solid rgba(250,77,109,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: 'var(--red)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontFamily: 'Syne', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
              <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="tu@email.com" autoComplete="email" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontFamily: 'Syne', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contraseña</label>
              <input className="input" type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px 18px', fontSize: 14 }}>
              {loading ? 'Entrando...' : 'Iniciar sesión →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-dim)', fontSize: 13 }}>
          ¿Sin cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
