import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import RequestForm from './pages/RequestForm'
import RequestView from './pages/RequestView'
import AuthFailure from './pages/AuthFailure'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function App(){
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  async function logout() {
    const logoutRes = await fetch(API + '/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    if (!logoutRes.ok) {
      window.location.href = API + '/auth/logout'
      return
    }

    const meRes = await fetch(API + '/auth/me', {
      credentials: 'include',
      cache: 'no-store'
    })
    const meData = await meRes.json()
    if (meData?.user) {
      window.location.href = API + '/auth/logout'
      return
    }

    setUser(null)
    navigate('/')
  }

  useEffect(() => {
    async function initAuth() {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('auth_token')
      if (token) {
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
          setUser(data.user)
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch {
          fetch(API + '/auth/me', { credentials: 'include', cache: 'no-store' })
            .then(r => r.json())
            .then(d => setUser(d.user))
            .catch(() => {})
        }
      } else {
        fetch(API + '/auth/me', { credentials: 'include', cache: 'no-store' })
          .then(r => r.json())
          .then(d => setUser(d.user))
          .catch(() => {})
      }
    }
    initAuth()
  }, [])

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: 20,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1><Link to="/">S.E.V.E.N. SOLIDARITY</Link></h1>
        <nav>
          <Link to="/">Home</Link> {' | '}
          <Link to="/new">Create</Link> {' | '}
          {user ? (
            <>
              <span style={{ marginLeft: 8 }}>{user.username}#{user.discriminator}</span>
              <button
                type="button"
                onClick={logout}
                style={{
                  marginLeft: 8,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#2563eb',
                  textDecoration: 'underline'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <a href={API + '/auth/discord'}>Login with Discord</a>
          )}
        </nav>
      </header>

      <main style={{ marginTop: 20 }}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/new" element={<RequestForm onCreated={id => navigate(`/r/${id}`)} />} />
          <Route path="/auth/failure" element={<AuthFailure />} />
          <Route path="/r/:id" element={<RequestView user={user} />} />
        </Routes>
      </main>
    </div>
  )
}
