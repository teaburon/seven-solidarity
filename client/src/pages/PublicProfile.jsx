import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../api'

function formatPostedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  const now = Date.now()
  const delta = now - date.getTime()
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour
  if (delta < oneHour) {
    const mins = Math.max(1, Math.floor(delta / (60 * 1000)))
    return `${mins} minute${mins === 1 ? '' : 's'} ago`
  }
  if (delta < oneDay) {
    const hours = Math.max(1, Math.floor(delta / oneHour))
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '-')
}

const PLATFORM_URLS = {
  'TikTok': 'https://tiktok.com/',
  'Instagram': 'https://instagram.com/',
  'Facebook': 'https://facebook.com/',
  'X / Twitter': 'https://twitter.com/',
  'LinkedIn': 'https://linkedin.com/in/',
  'Bluesky': 'https://bsky.app/profile/',
  'Mastodon': 'https://mastodon.social/@',
  'Threads': 'https://threads.net/@'
}

function normalizeContactUrl(value, label) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (label === 'Discord') return ''
  
  // If value looks like a handle (@username), try platform conversion
  if (raw.startsWith('@') && label && PLATFORM_URLS[label]) {
    if (label === 'TikTok') {
      return `https://tiktok.com/${raw}`
    }

    const handle = raw.substring(1)
    const baseUrl = PLATFORM_URLS[label]
    
    // For platforms that need @, append directly; others just /handle
    if (baseUrl.endsWith('@') || baseUrl.endsWith('/')) {
      return baseUrl + handle
    }
    return baseUrl + '/' + handle
  }
  
  // Otherwise try standard URL normalization
  const hasProtocol = /^https?:\/\//i.test(raw)
  const candidate = hasProtocol ? raw : `https://${raw}`
  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

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

  if (error) return <div className="error-banner">{error}</div>
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
      <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <h2 style={{ margin: 0 }}>{profile.displayName || profile.username}</h2>
          {profile.openToHelp && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#10b981', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>
              Open to help
            </span>
          )}
        </div>
        {isOwnProfile && (
          <Link
            to="/profile"
            className="btn btn-primary btn-pill"
            style={{ padding: '8px 14px', textDecoration: 'none' }}
          >
            Edit profile
          </Link>
        )}
      </div>
      <div style={{ color: 'var(--gray-600)', marginBottom: 8 }}>
        {profile.locationLabel && profile.city && profile.state && `${profile.locationLabel} (${profile.city}, ${profile.state})`}
        {profile.locationLabel && !profile.city && profile.locationLabel}
        {!profile.locationLabel && profile.city && profile.state && `${profile.city}, ${profile.state}`}
        {!profile.locationLabel && !profile.city && profile.zipcode && `Zip: ${profile.zipcode}`}
      </div>

      {profile.bio && <p>{profile.bio}</p>}

      {contactItems.length > 0 && (
        <section style={{ marginTop: 12, marginBottom: 8 }}>
          <div className="card" style={{ padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, var(--gray-100), #eef2ff)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 8 }}>
              Contact
            </div>
            <ul className="list-unstyled stack-sm">
              {contactItems.map((method, idx) => (
                <li key={idx} className="row" style={{ gap: 8 }}>
                  {method.label === 'Discord' || !normalizeContactUrl(method.value, method.label) ? (
                    <>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-900)', background: 'var(--gray-200)', padding: '2px 8px', borderRadius: 999 }}>
                        {method.label}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--gray-800)' }}>{method.value}</span>
                    </>
                  ) : (
                    <a
                      href={normalizeContactUrl(method.value, method.label)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-pill"
                      style={{ fontSize: 12, padding: '4px 10px', textDecoration: 'none' }}
                    >
                      {method.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {profile.offers?.length > 0 && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Offering</h3>
          <div className="row-wrap">
            {profile.offers.map(item => (
              <span key={item} className="chip" style={{ padding: '5px 10px', background: '#fef3c7', fontSize: 12 }}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {profile.skills?.length > 0 && (
        <section style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Skills</h3>
          <div className="row-wrap">
            {profile.skills.map(item => (
              <span key={item} className="chip" style={{ padding: '5px 10px', background: '#f3e8ff', fontSize: 12 }}>{item}</span>
            ))}
          </div>
        </section>
      )}

      {profile.requests?.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Requests ({profile.requests.length})</h3>
          <div className="stack" style={{ gap: 12 }}>
            {profile.requests.map(request => (
              <Link key={request._id} to={`/r/${request._id}`} className="card-link">
                <div className="card" style={{ cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{request.title}</div>
                  {request.requestLocation?.city && <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>{request.requestLocation.city}, {request.requestLocation.state}</div>}
                  {request.description && <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{request.description}</div>}
                  {request.tags?.length > 0 && (
                    <div className="row-wrap" style={{ marginTop: 8, gap: 6 }}>
                      {request.tags.map(tag => (
                        <span key={tag} className="chip chip-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
                    {request.status === 'open' ? '🟢 Open' : '🔴 Closed'} • {Array.isArray(request.responses) ? request.responses.length : 0} responses • {formatPostedAt(request.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
