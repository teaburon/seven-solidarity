import React, { useState } from 'react'
import { get, post } from '../api'

export default function RequestForm({ user, onCreated }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [requestCity, setRequestCity] = useState(user?.city || '')
  const [requestState, setRequestState] = useState(user?.state || '')
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function uniqueTags(list) {
    const out = []
    const seen = new Set()
    for (const rawTag of list) {
      const tag = String(rawTag).trim()
      if (!tag) continue
      const key = tag.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(tag)
    }
    return out
  }

  function selectedTags() {
    return uniqueTags(tags.split(','))
  }

  async function onTagsChange(value) {
    setTags(value)
    const parts = value.split(',')
    const current = (parts[parts.length - 1] || '').trim()
    if (!current) {
      setSuggestions([])
      return
    }
    try {
      const list = await get(`/requests/tags?q=${encodeURIComponent(current)}`)
      setSuggestions(Array.isArray(list) ? list : [])
    } catch {
      setSuggestions([])
    }
  }

  function applySuggestion(tag) {
    const parts = tags.split(',')
    const prefix = parts.slice(0, -1)
    const nextList = uniqueTags([...prefix, tag])
    const next = nextList.join(', ')
    setTags(next ? `${next}, ` : '')
    setSuggestions([])
  }

  function removeTag(tagToRemove) {
    const next = selectedTags().filter(tag => tag.toLowerCase() !== tagToRemove.toLowerCase())
    setTags(next.length ? `${next.join(', ')}, ` : '')
  }

  async function submit(e){
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      const body = { 
        title, 
        description, 
        tags: uniqueTags(tags.split(',')),
        requestLocation: {
          city: requestCity.trim(),
          state: requestState.trim()
        }
      }
      const created = await post('/api/requests', body)
      if (onCreated) onCreated(created._id)
    } catch (err) {
      setError('Failed to create request: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit} className="stack" style={{ maxWidth: 700 }}>
        <input required placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={6} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input 
            placeholder="City" 
            value={requestCity} 
            onChange={e => setRequestCity(e.target.value)} 
            title={user?.state ? `Must be in ${user.state}` : 'Set location in profile first'}
            disabled={!user?.state}
          />
          <input 
            placeholder="State (abbreviation)" 
            value={requestState} 
            onChange={e => setRequestState(e.target.value)} 
            title={user?.state ? `Must be in ${user.state}` : 'Set location in profile first'}
            disabled={!user?.state}
            maxLength={2}
          />
        </div>
        {user?.state && <div className="muted-note" style={{ fontSize: 12 }}>Location must be within {user.state}</div>}
        <input
          placeholder="tags, comma separated"
          value={tags}
          onChange={e => onTagsChange(e.target.value)}
        />
        {selectedTags().length > 0 && (
          <div className="row-wrap" style={{ gap: 6 }}>
            {selectedTags().map(tag => (
              <span key={tag} className="chip chip-filter" style={{ fontSize: 12 }}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{
                    background: 'transparent',
                    color: '#334155',
                    border: 'none',
                    borderRadius: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="card" style={{ maxWidth: 700, background: 'var(--white)' }}>
            {suggestions.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => applySuggestion(tag)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--white)',
                  color: 'var(--gray-900)',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  borderRadius: 0,
                  padding: 8,
                  cursor: 'pointer'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary btn-lg">{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  )
}
