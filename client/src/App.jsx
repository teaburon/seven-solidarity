import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import RequestForm from './pages/RequestForm'
import RequestView from './pages/RequestView'
import AuthFailure from './pages/AuthFailure'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function App(){
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function initAuth() {
      // Check URL for auth token from Discord callback
      const params = new URLSearchParams(window.location.search)
      const token = params.get('auth_token')
      console.log('initAuth: URL search params =', window.location.search, 'token =', token?.substring(0, 20) + '...' || 'none')
      if (token) {
        console.log('Found auth token in URL, exchanging for session')
        try {
          const res = await fetch(API + '/auth/exchange-token', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          })
          if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error || `HTTP ${res.status}`)
          }
          const data = await res.json()
          console.log('Token exchange succeeded, user:', data.user?.username)
          setUser(data.user)
          // Clear token from URL
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch (err) {
          console.error('Token exchange failed:', err.message)
          // Fall back to checking session
          fetch(API + '/auth/me', { credentials: 'include', cache: 'no-store' })
            .then(r=>r.json())
            .then(d=>setUser(d.user))
            .catch(()=>{})
        }
      } else {
        // Check current session
        console.log('No token in URL, checking current session')
        fetch(API + '/auth/me', { credentials: 'include', cache: 'no-store' })
          .then(r=>r.json())
          .then(d=>{console.log('Session check returned user:', d.user?.username || 'null'); setUser(d.user)})
          .catch(()=>{console.error("Failed to fetch user info")})
      }
    }
    initAuth()
  }, [])

  return (
    <div style={{
        maxWidth:900,
        margin:'0 auto',
        padding:20,
        fontFamily:'system-ui, sans-serif' 
    }}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1><Link to="/">S.E.V.E.N. SOLIDARITY</Link></h1>
        <nav>
          <Link to="/">Home</Link> {' | '}
          <Link to="/new">Create</Link> {' | '}
          {user ? (
            <>
              <span style={{marginLeft:8}}>{user.username}#{user.discriminator}</span>
              <a style={{marginLeft:8}} href={API + '/auth/logout'}>Logout</a>
            </>
          ) : (
            <a href={API + '/auth/discord'}>Login with Discord</a>
          )}
        </nav>
      </header>

      <main style={{marginTop:20}}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/new" element={<RequestForm onCreated={id=>navigate(`/r/${id}`)} />} />
          <Route path="/auth/failure" element={<AuthFailure />} />
          <Route path="/r/:id" element={<RequestView user={user} />} />
        </Routes>
      </main>
    </div>
  )
}
