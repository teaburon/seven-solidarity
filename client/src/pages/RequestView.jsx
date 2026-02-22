import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get, post } from '../api'

export default function RequestView({ user }){
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeType, setCloseType] = useState(null) // 'winner' or 'outside'

  useEffect(() => { if (id) load() }, [id])

  async function load(){
    try {
      setError('')
      const d = await get('/api/requests/' + id)
      setDoc(d)
    } catch (err) {
      setError('Failed to load request: ' + err.message)
    }
  }

  async function respond(e){
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      await post('/api/requests/' + id + '/respond', { message: msg })
      setMsg('')
      load()
    } catch (err) {
      setError('Failed to post response: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleClose(winnerUserId, outsidePlatform) {
    try {
      setError('')
      setLoading(true)
      await post('/api/requests/' + id + '/close', { 
        winnerUserId: outsidePlatform ? null : winnerUserId, 
        outsidePlatform 
      })
      setShowCloseModal(false)
      setCloseType(null)
      load()
    } catch (err) {
      setError('Failed to close request: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if(!doc) return <div>Loading...</div>

  const isAuthor = user && doc.author?._id && user.id === doc.author._id
  const canClose = isAuthor && doc.status === 'open'

  return (
    <div>
      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {doc.title}
        <span style={{ fontSize: 14, fontWeight: 600, color: doc.status === 'open' ? '#10b981' : '#ef4444' }}>
          {doc.status === 'open' ? '🟢 Open' : '🔴 Closed'}
        </span>
      </h2>
      {canClose && (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setShowCloseModal(true)}
            style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Close Request
          </button>
        </div>
      )}
      {doc.author?._id && (
        <div style={{ marginBottom: 8, fontSize: 13, color: '#475569' }}>
          Requested by <Link to={`/u/${doc.author._id}`}>{doc.author.displayName || doc.author.username}</Link>
        </div>
      )}
      <div style={{ marginBottom: 8 }}>{doc.description}</div>
      <div style={{ marginBottom: 16, color: '#666' }}>{doc.tags?.join(', ')}</div>

      <section>
        <h3>Responses</h3>
        {doc.responses?.length ? doc.responses.map(r => (
          <div key={r._id} style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
            <div style={{ fontSize: 13 }}>
              {r.user?._id ? (
                <Link to={`/u/${r.user._id}`}>{r.user.displayName || r.user.username}</Link>
              ) : (
                r.user?.displayName || r.user?.username
              )}
            </div>
            <div style={{ marginTop: 4 }}>{r.message}</div>
          </div>
        )) : <div>No responses yet</div>}
      </section>

      <section style={{ marginTop: 16 }}>
        <h4>Respond</h4>
        {user ? (
          <form onSubmit={respond} style={{ display: 'grid', gap: 8 }}>
            <textarea required value={msg} onChange={e => setMsg(e.target.value)} rows={4} disabled={loading} />
            <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Response'}</button>
          </form>
        ) : (
          <div>Please login to respond.</div>
        )}
      </section>

      {showCloseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 400, boxShadow: '0 20px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>{doc.responses?.length ? 'Who helped solve this?' : 'Cancel Request'}</h3>
            {doc.responses?.length ? (
              <>
                <p style={{ color: '#666', marginBottom: 16 }}>Select the user whose response helped solve your request, or indicate it was solved outside the platform.</p>
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {doc.responses.map(r => (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => handleClose(r.user._id, false)}
                      disabled={loading}
                      style={{ padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontSize: 13 }}
                    >
                      <strong>{r.user.displayName || r.user.username}</strong> - {r.message.slice(0, 60)}...
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: '#666', marginBottom: 16 }}>No responses yet. You can cancel this request.</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleClose(null, true)}
                disabled={loading}
                style={{ flex: 1, padding: 10, background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
              >
                {doc.responses?.length ? 'Solved outside platform' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                disabled={loading}
                style={{ padding: 10, background: '#e2e8f0', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
