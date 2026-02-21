import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../api'

export default function PublicProfile({ user }) {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) loadProfile()
  }, [id])

  async function loadProfile() {
    try {
      setError('')
      const data = await get(`/profile/${id}`)
      setProfile(data.profile)
    } catch (err) {
      setError('Failed to load profile: ' + err.message)
    }
  }

  if (error) return <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6 }}>{error}</div>
  if (!profile) return <div>Loading profile...</div>

  const isOwnProfile = user?.id && profile.id && user.id === profile.id

  const contactItems = []
  if (profile.allowDiscordContact && profile.username) {
    contactItems.push({ label: 'Discord', value: profile.username })
  }
  if (Array.isArray(profile.contactMethods)) {
    contactItems.push(
      ...profile.contactMethods.filter(method => method.label && method.value)
    )
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>{profile.displayName || profile.username}</h2>
        {isOwnProfile && (
          <Link
            to="/profile"
            style={{
              padding: '8px 14px',
              background: '#2563eb',
              color: '#fff',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Edit profile
          </Link>
        )}
      </div>
      <div style={{ color: '#475569', marginBottom: 8 }}>
        {profile.locationLabel && profile.city && profile.state && `${profile.locationLabel} (${profile.city}, ${profile.state})`}
        {profile.locationLabel && !profile.city && profile.locationLabel}
        {!profile.locationLabel && profile.city && profile.state && `${profile.city}, ${profile.state}`}
        {!profile.locationLabel && !profile.city && profile.zipcode && `Zip: ${profile.zipcode}`}
      </div>

      {profile.bio && <p>{profile.bio}</p>}

      {contactItems.length > 0 && (
        <section style={{ marginTop: 12, marginBottom: 8 }}>
          <div style={{ padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, #f8fafc, #eef2ff)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
              Contact
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
              {contactItems.map((method, idx) => (
                <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', background: '#e2e8f0', padding: '2px 8px', borderRadius: 999 }}>
                    {method.label}
                  </span>
                  <span style={{ fontSize: 13, color: '#1f2937' }}>{method.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {profile.offers?.length > 0 && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Offering</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile.offers.map(item => (
              <span key={item} style={{ padding: '5px 10px', borderRadius: 999, background: '#fef3c7', fontSize: 12 }}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {profile.skills?.length > 0 && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Skills</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile.skills.map(item => (
              <span key={item} style={{ padding: '5px 10px', borderRadius: 999, background: '#f3e8ff', fontSize: 12 }}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {profile.requests?.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Requests ({profile.requests.length})</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {profile.requests.map(request => (
              <div key={request._id} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{request.title}</div>
                {request.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{request.description}</div>}
                {request.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {request.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: '2px 6px', background: '#e0e7ff', borderRadius: 4 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  {request.status === 'open' ? '🟢 Open' : '🔴 Closed'} • {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
