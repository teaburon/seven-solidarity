import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get, post, put } from '../api'

function formatPostedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  const now = Date.now()
  const delta = now - date.getTime()
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour
  if (delta < oneHour) {
    const mins = Math.max(1, Math.floor(delta / (60 * 1000)))
    return `${mins} minute${mins === 1 ? '' : 's'} ago`
  }
  if (delta < oneDay) {
    const hours = Math.max(1, Math.floor(delta / oneHour))
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-')
}

function renderResponseText(message, mentionUsers) {
  const text = String(message || '')
  const mentionMap = new Map((mentionUsers || []).map(user => [String(user.username || '').toLowerCase(), user]))
  const pattern = /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_\.\-]+)/g
  const nodes = []
  let last = 0
  let matched

  while ((matched = pattern.exec(text)) !== null) {
    const matchValue = matched[0]
    const idx = matched.index
    if (idx > last) nodes.push(text.slice(last, idx))

    if (matchValue.startsWith('http://') || matchValue.startsWith('https://')) {
      nodes.push(
        <a key={`url-${idx}`} href={matchValue} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
          {matchValue}
        </a>
      )
    } else {
      const username = matchValue.slice(1).toLowerCase()
      const found = mentionMap.get(username)
      if (found?._id || found?.id) {
        nodes.push(
          <Link key={`mention-${idx}`} to={`/u/${found._id || found.id}`} style={{ color: '#2563eb' }}>
            {matchValue}
          </Link>
        )
      } else {
        nodes.push(matchValue)
      }
    }

    last = idx + matchValue.length
  }

  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export default function RequestView({ user }){
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [editRequestMode, setEditRequestMode] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editingResponseId, setEditingResponseId] = useState('')
  const [editingResponseText, setEditingResponseText] = useState('')

  useEffect(() => { if (id) load() }, [id])

  async function load(){
    try {
      setError('')
      const d = await get('/api/requests/' + id)
      setDoc(d)
      setEditTitle(d.title || '')
      setEditDescription(d.description || '')
      setEditTags((d.tags || []).join(', '))
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
      load()
    } catch (err) {
      setError('Failed to close request: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveRequestEdits(e) {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      await put('/api/requests/' + id, {
        title: editTitle,
        description: editDescription,
        tags: editTags
      })
      setEditRequestMode(false)
      await load()
    } catch (err) {
      setError('Failed to update request: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveResponseEdit(responseId) {
    try {
      setError('')
      setLoading(true)
      await put('/api/requests/' + id + '/respond/' + responseId, {
        message: editingResponseText
      })
      setEditingResponseId('')
      setEditingResponseText('')
      await load()
    } catch (err) {
      setError('Failed to update response: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if(!doc) return <div>Loading...</div>

  const isAuthor = user && doc.author?._id && user.id === doc.author._id
  const canClose = isAuthor && doc.status === 'open'
  const hasResponses = Array.isArray(doc.responses) && doc.responses.length > 0

  return (
    <div>
      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          {doc.title}
          <span style={{ fontSize: 14, fontWeight: 600, color: doc.status === 'open' ? '#10b981' : '#ef4444' }}>
            {doc.status === 'open' ? '🟢 Open' : '🔴 Closed'}
          </span>
          {doc.editedAt && <span style={{ fontSize: 11, color: '#64748b' }}>edited</span>}
        </h2>
        {canClose && (
          <button
            type="button"
            onClick={() => setShowCloseModal(true)}
            style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {hasResponses ? 'Close Request' : 'Cancel Request'}
          </button>
        )}
      </div>
      <div style={{ marginTop: 6, marginBottom: 10, color: '#64748b', fontSize: 12 }}>
        Posted {formatPostedAt(doc.createdAt)}
      </div>
      {isAuthor && !editRequestMode && (
        <div style={{ marginBottom: 10 }}>
          <button type="button" onClick={() => setEditRequestMode(true)} style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
            Edit Request
          </button>
        </div>
      )}
      {doc.author?._id && (
        <div style={{ marginBottom: 8, fontSize: 13, color: '#475569' }}>
          Requested by <Link to={`/u/${doc.author._id}`}>{doc.author.displayName || doc.author.username}</Link>
        </div>
      )}
      {editRequestMode ? (
        <form onSubmit={saveRequestEdits} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
          <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4} />
          <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="tag1, tag2" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setEditRequestMode(false)} disabled={loading}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>{doc.description}</div>
          {doc.tags?.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {doc.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: '3px 10px', background: '#e0e7ff', borderRadius: 999, color: '#3730a3' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <section>
        <h3>Responses</h3>
        {doc.responses?.length ? doc.responses.map(r => (
          <div key={r._id} style={{ borderTop: '1px solid #eee', paddingTop: 10, paddingBottom: 4 }}>
            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {r.user?._id ? (
                <Link to={`/u/${r.user._id}`}>{r.user.displayName || r.user.username}</Link>
              ) : (
                r.user?.displayName || r.user?.username
              )}
              <span style={{ fontSize: 11, color: '#64748b' }}>{formatPostedAt(r.createdAt)}</span>
              {r.editedAt && <span style={{ fontSize: 11, color: '#64748b' }}>edited</span>}
              {user?.id && r.user?._id && user.id === r.user._id && editingResponseId !== r._id && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingResponseId(r._id)
                    setEditingResponseText(r.message || '')
                  }}
                  style={{ fontSize: 11, border: '1px solid #cbd5e1', background: '#fff', borderRadius: 999, padding: '2px 8px', cursor: 'pointer' }}
                >
                  Edit
                </button>
              )}
            </div>
            {editingResponseId === r._id ? (
              <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                <textarea value={editingResponseText} onChange={e => setEditingResponseText(e.target.value)} rows={3} disabled={loading} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => saveResponseEdit(r._id)} disabled={loading}>Save</button>
                  <button type="button" onClick={() => setEditingResponseId('')} disabled={loading}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{renderResponseText(r.message, doc.mentionUsers)}</div>
            )}
          </div>
        )) : <div>No responses yet</div>}
      </section>

      <section style={{ marginTop: 16 }}>
        <h4>Respond</h4>
        {user ? (
          <form onSubmit={respond} style={{ display: 'grid', gap: 8 }}>
            <textarea required value={msg} onChange={e => setMsg(e.target.value)} rows={4} disabled={loading} />
            <div style={{ fontSize: 11, color: '#64748b' }}>
              You can mention people with @username and include links like https://example.org
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Response'}</button>
          </form>
        ) : (
          <div>Please login to respond.</div>
        )}
      </section>

      {showCloseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 420, boxShadow: '0 20px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>{doc.responses?.length ? 'Who helped solve this?' : 'Cancel Request'}</h3>
            {doc.responses?.length ? (
              <>
                <p style={{ color: '#666', marginBottom: 16 }}>Select the user whose response helped solve your request, or indicate it was solved outside the platform.</p>
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {[...new Map((doc.responses || []).filter(r => r.user?._id).map(r => [r.user._id, r.user])).values()].map(solutionUser => (
                    <button
                      key={solutionUser._id}
                      type="button"
                      onClick={() => handleClose(solutionUser._id, false)}
                      disabled={loading}
                      style={{ padding: 12, background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontSize: 13 }}
                    >
                      <strong>{solutionUser.displayName || solutionUser.username}</strong>
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
                {doc.responses?.length ? 'Solved outside platform' : 'Cancel request'}
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
