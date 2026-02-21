import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { get } from '../api'

const CONTACT_METHODS = [
  { key: 'discord', label: 'Discord' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'signal', label: 'Signal' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'other', label: 'Other' }
]

export default function PublicProfile() {
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

  return (
    <div style={{ maxWidth: 760 }}>
      <h2>{profile.displayName || profile.username}</h2>
      <div style={{ color: '#475569', marginBottom: 8 }}>
        {profile.locationLabel && profile.city && profile.state && `${profile.locationLabel} (${profile.city}, ${profile.state})`}
        {profile.locationLabel && !profile.city && profile.locationLabel}
        {!profile.locationLabel && profile.city && profile.state && `${profile.city}, ${profile.state}`}
        {!profile.locationLabel && !profile.city && profile.zipcode && `Zip: ${profile.zipcode}`}
      </div>

      {profile.bio && <p>{profile.bio}</p>}

      {profile.offers?.length > 0 && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Can Offer</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile.offers.map(item => (
              <span key={item} style={{ padding: '5px 10px', borderRadius: 999, background: '#e2e8f0', fontSize: 12 }}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {profile.waysToHelp?.length > 0 && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Ways to Help</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile.waysToHelp.map(item => (
              <span key={item} style={{ padding: '5px 10px', borderRadius: 999, background: '#dbeafe', fontSize: 12 }}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {(profile.contactMethods && Object.values(profile.contactMethods).some(v => v)) && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Contact</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {CONTACT_METHODS.map(method =>
              profile.contactMethods[method.key] && (
                <li key={method.key} style={{ margin: '4px 0' }}>
                  <strong>{method.label}:</strong> {profile.contactMethods[method.key]}
                </li>
              )
            )}
          </ul>
        </section>
      )}

      {profile.contact && !profile.contactMethods && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Contact</h3>
          <div>{profile.contact}</div>
        </section>
      )}
    </div>
  )
}
