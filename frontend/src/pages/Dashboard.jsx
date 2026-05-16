import { useState, useEffect } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'En progreso', color: 'bg-blue-50 text-blue-700' },
  done: { label: 'Hecho', color: 'bg-green-50 text-green-700' },
}

const FILTERS = ['all', 'pending', 'in_progress', 'done']
const FILTER_LABELS = { all: 'Todas', pending: 'Pendientes', in_progress: 'En progreso', done: 'Hechas' }

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [newTask, setNewTask] = useState({ title: '', description: '', team_id: '' })
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    Promise.all([fetchTasks(), fetchTeams()])
  }, [])

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks/')
      setTasks(data)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const { data } = await api.get('/teams/')
      setTeams(data)
    } catch {
      // no teams yet — fine
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        team_id: newTask.team_id ? parseInt(newTask.team_id) : null,
      }
      const { data } = await api.post('/tasks/', payload)
      setTasks([data, ...tasks])
      setNewTask({ title: '', description: '', team_id: '' })
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (taskId, status) => {
    const { data } = await api.put(`/tasks/${taskId}`, { status })
    setTasks(tasks.map((t) => (t.id === taskId ? data : t)))
  }

  const saveTitle = async (taskId) => {
    if (!editTitle.trim()) return
    const { data } = await api.put(`/tasks/${taskId}`, { title: editTitle })
    setTasks(tasks.map((t) => (t.id === taskId ? data : t)))
    setEditingId(null)
  }

  const deleteTask = async (taskId) => {
    await api.delete(`/tasks/${taskId}`)
    setTasks(tasks.filter((t) => t.id !== taskId))
  }

  const filtered = tasks.filter((t) => filter === 'all' || t.status === filter)
  const counts = tasks.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {})

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Mis Tareas</h1>
            <p className="text-sm text-gray-400 mt-0.5">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''} en total</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            + Nueva tarea
          </button>
        </div>

        {/* New task form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Nueva tarea</h2>
            <form onSubmit={createTask} className="space-y-3">
              <input
                type="text"
                placeholder="Título de la tarea *"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {teams.length > 0 && (
                <select
                  value={newTask.team_id}
                  onChange={(e) => setNewTask({ ...newTask, team_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-600"
                >
                  <option value="">Sin equipo (tarea personal)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear tarea'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['pending', 'in_progress', 'done'].map((s) => (
            <div key={s} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-2xl font-semibold text-gray-900">{counts[s] || 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">{STATUS_CONFIG[s].label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                filter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl h-16 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3">✓</p>
            <p className="text-sm">
              {filter === 'all' ? 'No tienes tareas. ¡Crea una!' : `No hay tareas en "${FILTER_LABELS[filter]}"`}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((task) => {
              const cfg = STATUS_CONFIG[task.status]
              const team = teams.find((t) => t.id === task.team_id)
              return (
                <li
                  key={task.id}
                  className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-gray-200 transition group"
                >
                  <div className="flex-1 min-w-0">
                    {editingId === task.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveTitle(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(task.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="text-sm font-medium w-full border-b border-blue-400 outline-none pb-0.5"
                      />
                    ) : (
                      <p
                        className="text-sm font-medium text-gray-900 truncate cursor-text"
                        onDoubleClick={() => { setEditingId(task.id); setEditTitle(task.title) }}
                        title="Doble clic para editar"
                      >
                        {task.title}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {team && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          {team.name}
                        </span>
                      )}
                      {task.description && (
                        <span className="text-xs text-gray-400 truncate">{task.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${cfg.color}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-200 hover:text-red-400 transition text-xl leading-none opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
