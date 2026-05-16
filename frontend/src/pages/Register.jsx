import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '' })
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
      await api.post('/auth/register', form)
      const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
      const { data: me } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
      login(me, data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ name, label, type = 'text', placeholder, minLength }) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontFamily: 'Syne', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
      <input className="input" type={type} name={name} value={form[name]} onChange={handleChange} required placeholder={placeholder} minLength={minLength} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'fixed', top: '30%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,109,142,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Task<span style={{ color: 'var(--accent)' }}>Flow</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Crea tu cuenta</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && (
            <div className="animate-fade-in" style={{ background: 'rgba(250,77,109,0.08)', border: '1px solid rgba(250,77,109,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: 'var(--red)', fontSize: 13 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field name="email" label="Email" type="email" placeholder="tu@email.com" />
            <Field name="username" label="Username" placeholder="johndoe" minLength={3} />
            <Field name="password" label="Contraseña" type="password" placeholder="mínimo 8 caracteres" minLength={8} />
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px 18px', fontSize: 14 }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-dim)', fontSize: 13 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
