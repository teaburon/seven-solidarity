import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import RequestForm from './pages/RequestForm'
import RequestView from './pages/RequestView'
import AuthFailure from './pages/AuthFailure'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function App(){
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
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
            .finally(() => setAuthLoading(false))
          return
        }
      } else {
        fetch(API + '/auth/me', { credentials: 'include', cache: 'no-store' })
          .then(r => r.json())
          .then(d => setUser(d.user))
          .catch(() => {})
          .finally(() => setAuthLoading(false))
        return
      }
      setAuthLoading(false)
    }
    initAuth()
  }, [])

  if (authLoading) {
    return <div className="page-shell auth">Loading...</div>
  }

  if (!user) {
    return (
      <div className="page-shell auth">
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ marginBottom: 8 }}>S.E.V.E.N. SOLIDARITY</h1>
          <p style={{ color: 'var(--gray-400)', marginTop: 0 }}>Log in to create, view, and search requests.</p>
        </header>
        <a href={API + '/auth/discord'} className="btn btn-primary btn-lg" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Login with Discord
        </a>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <h1 className='logo'><Link to="/">S.E.V.E.N. SOLIDARITY</Link></h1>
        <nav>
          <a href="/">Home</a> {' | '}
          <Link to="/new">Create</Link> {' | '}
          <>
            <Link style={{ marginLeft: 8 }} to={`/u/${user.id}`}>{user.displayName || user.username}</Link>
            <button
              type="button"
              onClick={logout}
              className="btn-link"
              style={{ marginLeft: 8 }}
            >
              Logout
            </button>
          </>
        </nav>
      </header>

      <main className="content-main">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/new" element={<RequestForm user={user} onCreated={id => navigate(`/r/${id}`)} />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/u/:id" element={<PublicProfile user={user} />} />
          <Route path="/auth/failure" element={<AuthFailure />} />
          <Route path="/r/:id" element={<RequestView user={user} />} />
        </Routes>
      </main>

      <footer className="footer">
        <p style={{ margin: '0 0 12px 0' }}>
          <a href="https://github.com/teaburon/seven-solidarity" target='_blank' rel='noopener noreferrer' className="footer-link">GitHub Repository</a>
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          © {new Date().getFullYear()} S.E.V.E.N. SOLIDARITY. All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: 12 }}>
          A mutual aid platform built with compassion for community support.
        </p>
      </footer>
      <div style={{ height: 28 }} />
    </div>
  )
}
