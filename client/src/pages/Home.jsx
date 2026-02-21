import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api'

export default function Home(){
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchList() }, [])

  async function fetchList(){
    try {
      setError('')
      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      if (tags) qs.set('tags', tags)
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
        <input placeholder="tags (comma)" value={tags} onChange={e => setTags(e.target.value)} />
        <button onClick={fetchList}>Search</button>
      </div>

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
