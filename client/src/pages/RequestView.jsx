import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get, post } from '../api'

export default function RequestView({ user }){
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  if(!doc) return <div>Loading...</div>

  return (
    <div>
      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      <h2>{doc.title}</h2>
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
    </div>
  )
}
