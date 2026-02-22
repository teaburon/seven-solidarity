import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api'

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

export default function Home({ user }){
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [showTagFilters, setShowTagFilters] = useState(false)
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { fetchList() }, [])

  async function loadTags() {
    try {
      const tags = await get('/requests/tags')
      const normalized = Array.isArray(tags) ? tags : []
      setAvailableTags(['closed', ...normalized])
    } catch {
      setAvailableTags(['closed'])
    }
  }

  async function toggleTagFilters() {
    const next = !showTagFilters
    setShowTagFilters(next)
    if (next && availableTags.length === 0) {
      await loadTags()
    }
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.some(t => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    )
  }

  function removeSelectedTag(tagToRemove) {
    setSelectedTags(prev => prev.filter(tag => tag.toLowerCase() !== tagToRemove.toLowerCase()))
  }

  function clearAllTags() {
    setSelectedTags([])
  }

  async function fetchList(){
    try {
      setError('')
      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      const wantsClosed = selectedTags.some(tag => tag.toLowerCase() === 'closed')
      if (wantsClosed) qs.set('includeClosed', '1')
      const normalTags = selectedTags.filter(tag => tag.toLowerCase() !== 'closed')
      if (normalTags.length) qs.set('tags', normalTags.join(','))
      const query = qs.toString()
      const data = await get(`/requests${query ? `?${query}` : ''}`)
      setList(data)
    } catch (err) {
      setError('Failed to load requests: ' + err.message)
    }
  }

  return (
    <div>
      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <button type="button" onClick={toggleTagFilters}>{showTagFilters ? 'Hide Filters' : 'Filter Tags'}</button>
        <button onClick={fetchList}>Search</button>
      </div>

      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {selectedTags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 999,
                background: '#e2e8f0',
                color: '#0f172a',
                fontSize: 12
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeSelectedTag(tag)}
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
          <button type="button" onClick={clearAllTags} style={{ background: 'transparent', color: '#2563eb', border: 'none', padding: 0, cursor: 'pointer' }}>
            Clear All
          </button>
        </div>
      )}

      {showTagFilters && (
        <div style={{ marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, padding: 10, background: '#fff' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableTags.length === 0 && <span style={{ fontSize: 12, color: '#64748b' }}>No tags yet.</span>}
            {availableTags.map(tag => {
              const selected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: selected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: selected ? '#dbeafe' : '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <ul>
        {list.map(r => (
          <li key={r._id} style={{ marginBottom: 10, listStyle: 'none' }}>
            <Link to={`/r/${r._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}><strong>{r.title}</strong></div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                  {r.author?.locationLabel || (r.author?.city && r.author?.state ? `${r.author.city}, ${r.author.state}` : (r.author?.zipcode ? `Zip: ${r.author.zipcode}` : 'Location unavailable'))}
                </div>
                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {r.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: '3px 10px', background: '#e0e7ff', borderRadius: 999, color: '#3730a3' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  {r.status === 'open' ? '🟢 Open' : '🔴 Closed'} • {Array.isArray(r.responses) ? r.responses.length : 0} responses • {formatPostedAt(r.createdAt)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
