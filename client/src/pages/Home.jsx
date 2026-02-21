import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api'

export default function Home(){
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [tags, setTags] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')

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

  useEffect(() => { fetchList() }, [])

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

  async function fetchList(){
    try {
      setError('')
      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      const unique = uniqueTags(tags.split(','))
      if (unique.length) qs.set('tags', unique.join(','))
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <input placeholder="tags (comma)" value={tags} onChange={e => onTagsChange(e.target.value)} />
        <button onClick={fetchList}>Search</button>
      </div>
      {selectedTags().length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {selectedTags().map(tag => (
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
        <div style={{ border: '1px solid #ddd', borderRadius: 6, maxWidth: 300, background: '#fff', marginBottom: 12 }}>
          {suggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => applySuggestion(tag)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: '#fff',
                color: '#0f172a',
                border: 'none',
                borderBottom: '1px solid #eee',
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

      <ul>
        {list.map(r => (
          <li key={r._id} style={{ marginBottom: 10 }}>
            <Link to={`/r/${r._id}`}><strong>{r.title}</strong></Link>
            <div style={{ fontSize: 12, color: '#666' }}>{r.description?.slice(0, 200)}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{r.tags?.join(', ')}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
