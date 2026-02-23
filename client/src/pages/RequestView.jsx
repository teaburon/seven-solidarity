import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
        <a key={`url-${idx}`} href={matchValue} target="_blank" rel="noreferrer" className="link-inline">
          {matchValue}
        </a>
      )
    } else {
      const username = matchValue.slice(1).toLowerCase()
      const found = mentionMap.get(username)
      if (found?._id || found?.id) {
        nodes.push(
          <Link key={`mention-${idx}`} to={`/u/${found._id || found.id}`} className="link-inline">
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
  const navigate = useNavigate()
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
      const result = await post('/api/requests/' + id + '/close', {
        winnerUserId: outsidePlatform ? null : winnerUserId, 
        outsidePlatform 
      })
      setShowCloseModal(false)
      if (result?.deleted) {
        navigate(`/u/${user?.id || doc?.author?._id}`)
        return
      }
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
  const chosenUserId = doc?.resolvedBy?._id || doc?.resolvedBy || null

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <div>
        <h2 className="request-header">
          {doc.title}
          <span className={`request-status-badge ${
            doc.status === 'open' ? 'request-status-open' : 'request-status-closed'
          }`}>
            {doc.status === 'open' ? '🟢 Open' : '🔴 Closed'}
          </span>
          {doc.editedAt && <span className="request-edited-flag">edited</span>}
        </h2>
        {canClose && (
          <div className="row-wrap request-actions">
            {isAuthor && !editRequestMode && (
              <button type="button" onClick={() => setEditRequestMode(true)} className="btn btn-pill btn-request-edit">
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCloseModal(true)}
              className="btn btn-danger btn-pill"
            >
              {hasResponses ? 'Close' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
      <div className="request-meta">
        Posted {formatPostedAt(doc.createdAt)}
      </div>
      {doc.author?._id && (
        <div className="section-submeta">
          Requested by <Link to={`/u/${doc.author._id}`}>{doc.author.displayName || doc.author.username}</Link>
        </div>
      )}
      {doc.requestLocation?.city && (
        <div className="section-submeta section-submeta-location">
          Location: {doc.requestLocation.city}, {doc.requestLocation.state}
        </div>
      )}
      {editRequestMode ? (
        <form onSubmit={saveRequestEdits} className="request-edit-form stack">
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
          <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4} />
          <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="tag1, tag2" />
          <div className="row-wrap">
            <button type="submit" disabled={loading} className="btn btn-primary btn-md">{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setEditRequestMode(false)} disabled={loading} className="btn btn-muted btn-md">Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="request-description">{renderResponseText(doc.description, doc.mentionUsers)}</div>
          {doc.tags?.length > 0 && (
            <div className="row-wrap request-tags">
              {doc.tags.map(tag => (
                <span key={tag} className="chip chip-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <section>
        <h3>Responses</h3>
        {doc.responses?.length ? doc.responses.map(r => {
          const isChosenSolution = Boolean(chosenUserId && r.user?._id && String(r.user._id) === String(chosenUserId))
          return (
          <div key={r._id} className={`response-item ${isChosenSolution ? 'response-item-chosen' : ''}`}>
            <div className="response-header">
              {r.user?._id && user?.id === r.user._id && editingResponseId !== r._id && doc.status === 'open' && (
                <button type="button" onClick={() => {
                  setEditingResponseId(r._id)
                  setEditingResponseText(r.message || '')
                }} className="btn-response-edit">
                  Edit
                </button>
              )}
              {r.user?._id ? (
                <Link to={`/u/${r.user._id}`}>{r.user.displayName || r.user.username}</Link>
              ) : (
                r.user?.displayName || r.user?.username
              )}
              <span className="response-timestamp">{formatPostedAt(r.createdAt)}</span>
              {r.editedAt && <span className="response-timestamp">edited</span>}
              {isChosenSolution && <span className="response-solution-badge">chosen solution</span>}
            </div>
            {editingResponseId === r._id ? (
              <div className="response-edit-section stack-sm">
                <textarea value={editingResponseText} onChange={e => setEditingResponseText(e.target.value)} rows={3} disabled={loading} />
                <div className="row-wrap">
                  <button type="button" onClick={() => saveResponseEdit(r._id)} disabled={loading} className="btn btn-primary btn-sm">Save</button>
                  <button type="button" onClick={() => setEditingResponseId('')} disabled={loading} className="btn btn-muted btn-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="response-content pre-wrap">{renderResponseText(r.message, doc.mentionUsers)}</div>
            )}
          </div>
        )}) : <div>No responses yet</div>}
      </section>

      {doc.status !== 'closed' && (
      <section className="respond-section">
        <h4>Respond</h4>
        {user ? (
          <form onSubmit={respond} className="stack">
            <textarea required value={msg} onChange={e => setMsg(e.target.value)} rows={4} disabled={loading} />
            <div className="respond-hint">
              You can mention people with @username and include links like https://example.org
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg">{loading ? 'Sending...' : 'Send Response'}</button>
          </form>
        ) : (
          <div>Please login to respond.</div>
        )}
      </section>
      )}

      {showCloseModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{doc.responses?.length ? 'Who helped solve this?' : 'Cancel Request'}</h3>
            {doc.responses?.length ? (
              <>
                <p className="modal-note">Select the user whose response helped solve your request, or indicate it was solved outside the platform.</p>
                <div className="modal-solutions stack">
                  {[...new Map((doc.responses || []).filter(r => r.user?._id).map(r => [r.user._id, r.user])).values()].map(solutionUser => (
                    <button
                      key={solutionUser._id}
                      type="button"
                      onClick={() => handleClose(solutionUser._id, false)}
                      disabled={loading}
                      className="btn-modal-solution"
                    >
                      <strong>{solutionUser.displayName || solutionUser.username}</strong>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="modal-note">No responses yet. You can cancel this request.</p>
            )}
            <div className="modal-actions row-wrap">
              <button
                type="button"
                onClick={() => handleClose(null, true)}
                disabled={loading}
                className="btn btn-primary modal-action-btn"
              >
                {doc.responses?.length ? 'Solved outside platform' : 'Cancel request'}
              </button>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                disabled={loading}
                className="btn btn-muted modal-action-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
