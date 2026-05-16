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
    try { const { data } = await api.get('/teams/'); setTeams(data); if (data.length > 0 && !selected) setSelected(data[0]) }
    finally { setLoading(false) }
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
      setTeams([...teams, data]); setSelected(data); setNewTeamName('')
      showFeedback(`Equipo "${data.name}" creado`)
    } catch (err) { showFeedback(err.response?.data?.detail || 'Error', 'error') }
    finally { setCreating(false) }
  }

  const inviteMember = async (e) => {
    e.preventDefault()
    if (!selected || !inviteEmail.trim()) return
    setInviting(true)
    try {
      const { data } = await api.post(`/teams/${selected.id}/invite`, { email: inviteEmail })
      const { data: updated } = await api.get(`/teams/${selected.id}`)
      setTeams(teams.map(t => t.id === updated.id ? updated : t)); setSelected(updated)
      setInviteEmail(''); showFeedback(data.message)
    } catch (err) { showFeedback(err.response?.data?.detail || 'Error', 'error') }
    finally { setInviting(false) }
  }

  const removeMember = async (teamId, userId) => {
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      const { data: updated } = await api.get(`/teams/${teamId}`)
      setTeams(teams.map(t => t.id === updated.id ? updated : t)); setSelected(updated)
      showFeedback('Miembro eliminado')
    } catch (err) { showFeedback(err.response?.data?.detail || 'Error', 'error') }
  }

  const isOwner = selected && user && selected.owner_id === user.id

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', margin: 0 }}>Equipos</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 13 }}>{teams.length} equipo{teams.length !== 1 ? 's' : ''}</p>
        </div>

        {feedback.msg && (
          <div className="animate-fade-in" style={{ background: feedback.type === 'error' ? 'rgba(250,77,109,0.08)' : 'rgba(77,250,154,0.08)', border: `1px solid ${feedback.type === 'error' ? 'rgba(250,77,109,0.2)' : 'rgba(77,250,154,0.2)'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 20, color: feedback.type === 'error' ? 'var(--red)' : 'var(--green)', fontSize: 13 }}>
            {feedback.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card animate-fade-up-1" style={{ padding: 20 }}>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>Nuevo equipo</p>
              <form onSubmit={createTeam} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input" placeholder="Nombre del equipo" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ justifyContent: 'center' }}>{creating ? 'Creando...' : 'Crear'}</button>
              </form>
            </div>

            <div className="card animate-fade-up-2" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Tus equipos</p>
              </div>
              {loading ? (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 36 }} />)}
                </div>
              ) : teams.length === 0 ? (
                <p style={{ padding: '20px', color: 'var(--text-dim)', fontSize: 13 }}>Sin equipos</p>
              ) : (
                <div>
                  {teams.map(team => (
                    <button key={team.id} onClick={() => setSelected(team)} style={{ width: '100%', textAlign: 'left', padding: '12px 20px', background: selected?.id === team.id ? 'rgba(124,109,250,0.08)' : 'transparent', border: 'none', borderLeft: `2px solid ${selected?.id === team.id ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 14, color: selected?.id === team.id ? 'var(--text)' : 'var(--text-muted)' }}>{team.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Syne' }}>{team.members?.length || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main */}
          <div className="animate-fade-up-3">
            {!selected ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
                <p style={{ fontSize: 14 }}>Selecciona o crea un equipo</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Team header */}
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-0.02em' }}>{selected.name}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '4px 0 0' }}>Creado el {new Date(selected.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                    {isOwner && <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(250,204,77,0.12)', color: 'var(--amber)', padding: '4px 10px', borderRadius: 20 }}>Owner</span>}
                  </div>
                </div>

                {/* Members */}
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Miembros</p>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: 'var(--text-dim)' }}>{selected.members?.length || 0}</span>
                  </div>
                  {selected.members?.length === 0 ? (
                    <p style={{ padding: '20px 24px', color: 'var(--text-dim)', fontSize: 13 }}>Sin miembros</p>
                  ) : (
                    <div style={{ divide: '1px solid var(--border)' }}>
                      {selected.members?.map(member => (
                        <div key={member.id} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>
                              {member.user_id.toString().slice(-2)}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>Usuario #{member.user_id}</p>
                              <span className={`badge ${member.role === 'owner' ? '' : 'badge-pending'}`} style={member.role === 'owner' ? { background: 'rgba(250,204,77,0.1)', color: 'var(--amber)', padding: '1px 8px', fontSize: 10 } : { padding: '1px 8px', fontSize: 10 }}>
                                {member.role}
                              </span>
                            </div>
                          </div>
                          {isOwner && member.role !== 'owner' && (
                            <button onClick={() => removeMember(selected.id, member.user_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 13, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--red)'} onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}>
                              Eliminar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invite */}
                {isOwner && (
                  <div className="card" style={{ padding: 24 }}>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 14px' }}>Invitar miembro</p>
                    <form onSubmit={inviteMember} style={{ display: 'flex', gap: 8 }}>
                      <input className="input" type="email" placeholder="email@usuario.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                      <button type="submit" disabled={inviting} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>{inviting ? '...' : 'Invitar'}</button>
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
