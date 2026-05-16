import { useState, useEffect } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'
import { useAuthStore } from '../store/authStore'

export default function TeamManager() {
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [feedback, setFeedback] = useState({ msg: '', type: '' })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => { fetchTeams() }, [])

  const fetchTeams = async () => {
    try {
      const { data } = await api.get('/teams/')
      setTeams(data)
      if (data.length > 0 && !selected) setSelected(data[0])
    } finally {
      setLoading(false)
    }
  }

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type })
    setTimeout(() => setFeedback({ msg: '', type: '' }), 3500)
  }

  const createTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/teams/', { name: newTeamName })
      setTeams([...teams, data])
      setSelected(data)
      setNewTeamName('')
      showFeedback(`Equipo "${data.name}" creado`)
    } catch (err) {
      showFeedback(err.response?.data?.detail || 'Error al crear equipo', 'error')
    } finally {
      setCreating(false)
    }
  }

  const inviteMember = async (e) => {
    e.preventDefault()
    if (!selected || !inviteEmail.trim()) return
    setInviting(true)
    try {
      const { data } = await api.post(`/teams/${selected.id}/invite`, { email: inviteEmail })
      // Refresh team to update member list
      const { data: updated } = await api.get(`/teams/${selected.id}`)
      setTeams(teams.map((t) => (t.id === updated.id ? updated : t)))
      setSelected(updated)
      setInviteEmail('')
      showFeedback(data.message)
    } catch (err) {
      showFeedback(err.response?.data?.detail || 'Error al invitar', 'error')
    } finally {
      setInviting(false)
    }
  }

  const removeMember = async (teamId, userId) => {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      const { data: updated } = await api.get(`/teams/${teamId}`)
      setTeams(teams.map((t) => (t.id === updated.id ? updated : t)))
      setSelected(updated)
      showFeedback('Miembro eliminado')
    } catch (err) {
      showFeedback(err.response?.data?.detail || 'Error', 'error')
    }
  }

  const isOwner = selected && user && selected.owner_id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Equipos</h1>

        {/* Feedback */}
        {feedback.msg && (
          <div className={`text-sm px-4 py-3 rounded-xl mb-5 border ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-100'
              : 'bg-green-50 text-green-700 border-green-100'
          }`}>
            {feedback.msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar: team list + create */}
          <div className="space-y-4">
            <form onSubmit={createTeam} className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Nuevo equipo</p>
              <input
                type="text"
                placeholder="Nombre del equipo"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear equipo'}
              </button>
            </form>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 border-b border-gray-100">
                Tus equipos
              </p>
              {loading ? (
                <div className="p-4 space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-9 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : teams.length === 0 ? (
                <p className="text-sm text-gray-400 p-4">Sin equipos todavía</p>
              ) : (
                <ul>
                  {teams.map((team) => (
                    <li key={team.id}>
                      <button
                        onClick={() => setSelected(team)}
                        className={`w-full text-left px-4 py-3 text-sm transition ${
                          selected?.id === team.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          {team.name}
                          <span className="text-xs text-gray-400">
                            {team.members?.length || 0} miembro{(team.members?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Main: team detail */}
          <div className="md:col-span-2">
            {!selected ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400">
                <p className="text-3xl mb-3">👥</p>
                <p className="text-sm">Selecciona un equipo o crea uno nuevo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Team header */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">{selected.name}</h2>
                    {isOwner && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Creado el {new Date(selected.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>

                {/* Members */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 border-b border-gray-100">
                    Miembros ({selected.members?.length || 0})
                  </p>
                  {selected.members?.length === 0 ? (
                    <p className="text-sm text-gray-400 p-5">Sin miembros</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {selected.members?.map((member) => (
                        <li key={member.id} className="px-5 py-3 flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-700">Usuario #{member.user_id}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                              member.role === 'owner'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                          {isOwner && member.role !== 'owner' && (
                            <button
                              onClick={() => removeMember(selected.id, member.user_id)}
                              className="text-xs text-gray-300 hover:text-red-400 transition"
                            >
                              Eliminar
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Invite */}
                {isOwner && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Invitar miembro
                    </p>
                    <form onSubmit={inviteMember} className="flex gap-2">
                      <input
                        type="email"
                        placeholder="email@usuario.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={inviting}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-50"
                      >
                        {inviting ? '...' : 'Invitar'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
