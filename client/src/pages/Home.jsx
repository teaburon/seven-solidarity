import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api'

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
      setAvailableTags(Array.isArray(tags) ? tags : [])
    } catch {
      setAvailableTags([])
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
      if (selectedTags.length) qs.set('tags', selectedTags.join(','))
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
          <li key={r._id} style={{ marginBottom: 10 }}>
            <Link to={`/r/${r._id}`}><strong>{r.title}</strong></Link>
            {r.author?._id && (
              <div style={{ fontSize: 12, color: '#475569' }}>
                by <Link to={`/u/${r.author._id}`}>{r.author.displayName || r.author.username}</Link>
              </div>
            )}
            <div style={{ fontSize: 12, color: '#666' }}>{r.description?.slice(0, 200)}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{r.tags?.join(', ')}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
