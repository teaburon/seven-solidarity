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
  const [locationGate, setLocationGate] = useState('')

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
    setSelectedTags(prev => {
      const updated = prev.some(t => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
      setTimeout(() => fetchListWithTags(updated), 0)
      return updated
    })
  }

  function removeSelectedTag(tagToRemove) {
    const updated = selectedTags.filter(tag => tag.toLowerCase() !== tagToRemove.toLowerCase())
    setSelectedTags(updated)
    fetchListWithTags(updated)
  }

  function clearAllTags() {
    setSelectedTags([])
    fetchListWithTags([])
  }

  async function fetchListWithTags(tags) {
    try {
      setError('')
      setLocationGate('')
      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      const wantsClosed = tags.some(tag => tag.toLowerCase() === 'closed')
      if (wantsClosed) qs.set('status', 'closed')
      else if (q) qs.set('includeClosed', '1')
      const normalTags = tags.filter(tag => tag.toLowerCase() !== 'closed')
      if (normalTags.length) qs.set('tags', normalTags.join(','))
      const query = qs.toString()
      const data = await get(`/requests${query ? `?${query}` : ''}`)
      setList(data)
    } catch (err) {
      if (String(err.message || '').toLowerCase().includes('set your location')) {
        setLocationGate('Set your location in Profile before viewing requests. You can change location every 30 days.')
        setList([])
        return
      }
      setError('Failed to load requests: ' + err.message)
    }
  }

  async function fetchList(){
    try {
      setError('')
      setLocationGate('')
      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      const wantsClosed = selectedTags.some(tag => tag.toLowerCase() === 'closed')
      if (wantsClosed) qs.set('status', 'closed')
      else if (q) qs.set('includeClosed', '1')
      const normalTags = selectedTags.filter(tag => tag.toLowerCase() !== 'closed')
      if (normalTags.length) qs.set('tags', normalTags.join(','))
      const query = qs.toString()
      const data = await get(`/requests${query ? `?${query}` : ''}`)
      setList(data)
    } catch (err) {
      if (String(err.message || '').toLowerCase().includes('set your location')) {
        setLocationGate('Set your location in Profile before viewing requests. You can change location every 30 days.')
        setList([])
        return
      }
      setError('Failed to load requests: ' + err.message)
    }
  }

  return (
    <div>
      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Search requests, titles, or usernames..." style={{ flex: 1, minWidth: 360 }} value={q} onChange={e => {
          setQ(e.target.value)
          setTimeout(() => {
            const qs = new URLSearchParams()
            if (e.target.value) qs.set('q', e.target.value)
            const wantsClosed = selectedTags.some(tag => tag.toLowerCase() === 'closed')
            if (wantsClosed) qs.set('status', 'closed')
            else if (e.target.value) qs.set('includeClosed', '1')
            const normalTags = selectedTags.filter(tag => tag.toLowerCase() !== 'closed')
            if (normalTags.length) qs.set('tags', normalTags.join(','))
            const query = qs.toString()
            get(`/requests${query ? `?${query}` : ''}`)
              .then(data => {
                setLocationGate('')
                setList(data)
              })
              .catch(err => {
                if (String(err.message || '').toLowerCase().includes('set your location')) {
                  setLocationGate('Set your location in Profile before viewing requests. You can change location every 30 days.')
                  setList([])
                  return
                }
                setError('Failed to load: ' + err.message)
              })
          }, 300)
        }} />
        <button onClick={fetchList} style={{ whiteSpace: 'nowrap', background: 'var(--primary)', color: 'var(--white)', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }}>Search</button>
        <button type="button" onClick={toggleTagFilters} style={{ whiteSpace: 'nowrap', background: 'var(--primary)', color: 'var(--white)', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }}>{showTagFilters ? 'Hide Filters' : 'Filter Tags'}</button>
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
                color: 'var(--gray-900)',
                fontSize: 14
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
                  fontSize: 14
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button type="button" onClick={clearAllTags} style={{ background: 'transparent', color: 'var(--primary)', border: 'none', padding: 0, cursor: 'pointer' }}>
            Clear All
          </button>
        </div>
      )}

      {locationGate && (
        <div style={{ padding: 12, borderRadius: 6, marginBottom: 12, background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' }}>
          {locationGate} <Link to="/profile" style={{ color: '#c2410c', fontWeight: 600 }}>Set location</Link>
        </div>
      )}

      {showTagFilters && (
        <div style={{ marginBottom: 12, border: '1px solid #ddd', borderRadius: 8, padding: 10, background: '#fff' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableTags.length === 0 && <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>No tags yet.</span>}
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
                    border: selected ? '1px solid var(--primary)' : '1px solid var(--gray-300)',
                    background: selected ? 'var(--primary-light-bg)' : 'var(--gray-100)',
                    color: selected ? 'var(--black)' : 'var(--gray-900)',
                    cursor: 'pointer',
                    fontWeight: selected ? 600 : 400
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
              <div style={{ padding: 12, border: '1px solid var(--gray-200)', borderRadius: 6, background: 'var(--gray-100)', cursor: 'pointer', transition: 'background 0.2s' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  <h2 class='title'>{r.title}</h2></div>
                <div style={{ fontSize: 14, color: 'var(--gray-600)', marginTop: 4 }}>
                  {r.requestLocation?.city ? `${r.requestLocation.city}, ${r.requestLocation.state}` : (r.author?.locationLabel || (r.author?.city && r.author?.state ? `${r.author.city}, ${r.author.state}` : (r.author?.zipcode ? `Zip: ${r.author.zipcode}` : 'Location unavailable')))}
                </div>
                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {r.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 14, padding: '3px 10px', background: 'var(--primary-light-bg)', borderRadius: 999, color: 'var(--black)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 6 }}>
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
