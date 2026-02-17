import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get, post } from '../api'

export default function RequestView({ user }){
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(()=>{ if(id) load() }, [id])

  async function load(){
    const d = await get('/api/requests/' + id)
    setDoc(d)
  }

  async function respond(e){
    e.preventDefault()
    await post('/api/requests/' + id + '/respond', { message: msg })
    setMsg('')
    load()
  }

  if(!doc) return <div>Loading...</div>

  return (
    <div>
      <h2>{doc.title}</h2>
      <div style={{marginBottom:8}}>{doc.description}</div>
      <div style={{marginBottom:16,color:'#666'}}>{doc.tags?.join(', ')}</div>

      <section>
        <h3>Responses</h3>
        {doc.responses?.length ? doc.responses.map(r=> (
          <div key={r._id} style={{borderTop:'1px solid #eee',paddingTop:8}}>
            <div style={{fontSize:13}}>{r.user?.username}#{r.user?.discriminator}</div>
            <div style={{marginTop:4}}>{r.message}</div>
          </div>
        )) : <div>No responses yet</div>}
      </section>

      <section style={{marginTop:16}}>
        <h4>Respond</h4>
        {user ? (
          <form onSubmit={respond} style={{display:'grid',gap:8}}>
            <textarea required value={msg} onChange={e=>setMsg(e.target.value)} rows={4} />
            <button type="submit">Send Response</button>
          </form>
        ) : (
          <div>Please login to respond.</div>
        )}
      </section>
    </div>
  )
}
