import { useState, useEffect } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'

const STATUS = {
  pending: { label: 'Pendiente', cls: 'badge-pending', dot: '#666680' },
  in_progress: { label: 'En progreso', cls: 'badge-in_progress', dot: '#7c6dfa' },
  done: { label: 'Hecho', cls: 'badge-done', dot: '#4dfa9a' },
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', team_id: '', due_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => { Promise.all([fetchTasks(), fetchTeams()]) }, [])

  const fetchTasks = async () => {
    try { const { data } = await api.get('/tasks/'); setTasks(data) }
    finally { setLoading(false) }
  }
  const fetchTeams = async () => {
    try { const { data } = await api.get('/teams/'); setTeams(data) } catch {}
  }

  const createTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    setSubmitting(true)
    try {
      const payload = { title: newTask.title, description: newTask.description, team_id: newTask.team_id ? parseInt(newTask.team_id) : null, due_date: newTask.due_date || null }
      const { data } = await api.post('/tasks/', payload)
      setTasks([data, ...tasks])
      setNewTask({ title: '', description: '', team_id: '', due_date: '' })
      setShowForm(false)
    } finally { setSubmitting(false) }
  }

  const updateStatus = async (id, status) => {
    const { data } = await api.put(`/tasks/${id}`, { status })
    setTasks(tasks.map(t => t.id === id ? data : t))
  }

  const saveTitle = async (id) => {
    if (!editTitle.trim()) return
    const { data } = await api.put(`/tasks/${id}`, { title: editTitle })
    setTasks(tasks.map(t => t.id === id ? data : t))
    setEditingId(null)
  }

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const counts = { pending: 0, in_progress: 0, done: 0 }
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++ })

  const isOverdue = (task) => task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ position: 'fixed', top: 0, right: 0, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,109,250,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>Mis Tareas</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 13 }}>{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? '✕ Cancelar' : '+ Nueva tarea'}
          </button>
        </div>

        {/* New task form */}
        {showForm && (
          <div className="card animate-fade-up" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, margin: '0 0 20px', color: 'var(--text)' }}>Nueva tarea</h3>
            <form onSubmit={createTask} style={{ display: 'grid', gap: 12 }}>
              <input className="input" placeholder="Título de la tarea *" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required autoFocus />
              <input className="input" placeholder="Descripción (opcional)" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input className="input" type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} style={{ colorScheme: 'dark' }} />
                {teams.length > 0 && (
                  <select className="input" value={newTask.team_id} onChange={e => setNewTask({ ...newTask, team_id: e.target.value })} style={{ cursor: 'pointer' }}>
                    <option value="">Sin equipo</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Creando...' : 'Crear tarea'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="animate-fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {Object.entries(STATUS).map(([key, cfg]) => (
            <div key={key} className="card" style={{ padding: 20, cursor: 'pointer', borderColor: filter === key ? 'var(--accent)' : undefined, background: filter === key ? 'rgba(124,109,250,0.05)' : undefined }} onClick={() => setFilter(filter === key ? 'all' : key)}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', lineHeight: 1 }}>{counts[key]}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Syne', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{cfg.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="animate-fade-up-2" style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {[['all', 'Todas'], ['pending', 'Pendientes'], ['in_progress', 'En progreso'], ['done', 'Hechas']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 12, letterSpacing: '0.02em', padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: filter === val ? 'var(--bg-3)' : 'transparent', color: filter === val ? 'var(--text)' : 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="animate-fade-up-3">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
              <p style={{ fontSize: 14 }}>{filter === 'all' ? 'No tienes tareas. ¡Crea una!' : 'Sin tareas en esta categoría'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map((task, i) => {
                const overdue = isOverdue(task)
                const team = teams.find(t => t.id === task.team_id)
                return (
                  <div key={task.id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, animation: `fadeUp 0.3s ${i * 0.04}s ease both`, borderColor: overdue ? 'rgba(250,77,109,0.2)' : undefined }}>
                    {/* Status dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS[task.status].dot, flexShrink: 0, boxShadow: task.status === 'done' ? '0 0 8px rgba(77,250,154,0.5)' : task.status === 'in_progress' ? '0 0 8px rgba(124,109,250,0.5)' : 'none' }} />

                    {/* Title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === task.id ? (
                        <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => saveTitle(task.id)} onKeyDown={e => { if (e.key === 'Enter') saveTitle(task.id); if (e.key === 'Escape') setEditingId(null) }} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', outline: 'none', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, width: '100%', padding: '2px 0' }} />
                      ) : (
                        <p onDoubleClick={() => { setEditingId(task.id); setEditTitle(task.title) }} style={{ margin: 0, fontSize: 14, fontWeight: 400, color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none', cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Doble clic para editar">
                          {task.title}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        {team && <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Syne', fontWeight: 600 }}>#{team.name}</span>}
                        {task.due_date && (
                          <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text-dim)' }}>
                            {overdue ? '⚠ ' : ''}
                            {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {task.description && <span style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{task.description}</span>}
                      </div>
                    </div>

                    {/* Status select */}
                    <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', color: STATUS[task.status].dot, fontFamily: 'Syne', fontWeight: 600, fontSize: 11, cursor: 'pointer', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {Object.entries(STATUS).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                    </select>

                    {/* Delete */}
                    <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18, lineHeight: 1, padding: '0 4px', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--red)'} onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}>×</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
