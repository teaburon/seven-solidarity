import React, { useState } from 'react'
import { post } from '../api'

export default function RequestForm({ onCreated }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e){
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      const body = { title, description, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }
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
        <input placeholder="tags, comma separated" value={tags} onChange={e => setTags(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  )
}
