import React from 'react'
import { Link } from 'react-router-dom'

export default function AuthFailure() {
  return (
    <div className="centered" style={{ padding: '40px' }}>
      <h2 style={{color:'#dc2626'}}>Authentication Failed</h2>
      <p>Unable to log in with Discord. Please try again.</p>
      <Link to="/" className="btn btn-primary btn-lg" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>
        Return Home
      </Link>
    </div>
  )
}
