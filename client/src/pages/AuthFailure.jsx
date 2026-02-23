import React from 'react'
import { Link } from 'react-router-dom'

export default function AuthFailure() {
  return (
    <div style={{textAlign:'center',padding:'40px'}}>
      <h2 style={{color:'#dc2626'}}>Authentication Failed</h2>
      <p>Unable to log in with Discord. Please try again.</p>
      <Link to="/" style={{
        display:'inline-block',
        marginTop:20,
        padding:'10px 20px',
        background:'var(--primary)',
        color:'var(--white)',
        textDecoration:'none',
        borderRadius:6
      }}>
        Return Home
      </Link>
    </div>
  )
}
