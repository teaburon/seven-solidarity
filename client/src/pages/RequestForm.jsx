import React, { useState } from 'react'
import { get, post } from '../api'

export default function RequestForm({ onCreated }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
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
      const body = { title, description, tags: uniqueTags(tags.split(',')) }
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
      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 700 }}>
        <input required placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={6} />
        <input
          placeholder="tags, comma separated"
          value={tags}
          onChange={e => onTagsChange(e.target.value)}
        />
        {selectedTags().length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
          <div style={{ border: '1px solid #ddd', borderRadius: 6, maxWidth: 700, background: '#fff' }}>
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
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  )
}
