import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, put } from '../api'

function listToText(list) {
  return Array.isArray(list) ? list.join(', ') : ''
}

function textToUniqueList(text) {
  const items = String(text || '').split(',').map(item => item.trim()).filter(Boolean)
  const unique = []
  const seen = new Set()
  for (const item of items) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }
  return unique
}

export default function Profile({ user, setUser }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    displayName: '',
    zipcode: '',
    locationLabel: '',
    bio: '',
    contact: '',
    offersText: '',
    waysToHelpText: '',
    openToHelp: true
  })

  const offersPreview = useMemo(() => textToUniqueList(form.offersText), [form.offersText])
  const waysPreview = useMemo(() => textToUniqueList(form.waysToHelpText), [form.waysToHelpText])

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    loadProfile()
  }, [user])

  async function loadProfile() {
    try {
      setError('')
      setLoading(true)
      const data = await get('/profile/me')
      const profile = data.profile || {}
      setForm({
        displayName: profile.displayName || profile.username || '',
        zipcode: profile.zipcode || '',
        locationLabel: profile.locationLabel || '',
        bio: profile.bio || '',
        contact: profile.contact || '',
        offersText: listToText(profile.offers),
        waysToHelpText: listToText(profile.waysToHelp),
        openToHelp: profile.openToHelp !== false
      })
    } catch (err) {
      setError('Failed to load profile: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        displayName: form.displayName,
        zipcode: form.zipcode,
        locationLabel: form.locationLabel,
        bio: form.bio,
        contact: form.contact,
        offers: textToUniqueList(form.offersText),
        waysToHelp: textToUniqueList(form.waysToHelpText),
        openToHelp: form.openToHelp
      }

      const data = await put('/profile/me', payload)
      const updated = data.profile

      updateField('offersText', listToText(updated.offers))
      updateField('waysToHelpText', listToText(updated.waysToHelp))

      if (setUser && user) {
        setUser({
          ...user,
          displayName: updated.displayName,
          openToHelp: updated.openToHelp
        })
      }

      setSuccess('Profile saved.')
    } catch (err) {
      setError('Failed to save profile: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null
  if (loading) return <div>Loading profile...</div>

  return (
    <div style={{ maxWidth: 760 }}>
      <h2>Your Profile</h2>
      <p style={{ color: '#475569', marginTop: 0 }}>
        This helps neighbors know who you are and how you can offer mutual aid.
      </p>

      {error && <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ padding: 12, background: '#ecfdf3', color: '#047857', borderRadius: 6, marginBottom: 12 }}>{success}</div>}

      <form onSubmit={saveProfile} style={{ display: 'grid', gap: 10 }}>
        <label>
          Display name
          <input value={form.displayName} onChange={e => updateField('displayName', e.target.value)} placeholder="How your name appears" />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            Zip code
            <input value={form.zipcode} onChange={e => updateField('zipcode', e.target.value)} placeholder="e.g. 98101" />
          </label>
          <label>
            Location label
            <input value={form.locationLabel} onChange={e => updateField('locationLabel', e.target.value)} placeholder="Neighborhood / city" />
          </label>
        </div>

        <label>
          Short bio
          <textarea rows={4} value={form.bio} onChange={e => updateField('bio', e.target.value)} placeholder="What matters to you, your community, and what support you care about." />
        </label>

        <label>
          Best way to reach you
          <input value={form.contact} onChange={e => updateField('contact', e.target.value)} placeholder="Discord DM, email, Signal, etc." />
        </label>

        <label>
          What you can offer (comma separated)
          <input value={form.offersText} onChange={e => updateField('offersText', e.target.value)} placeholder="rides, groceries, translation, childcare" />
        </label>

        <label>
          Ways you can help (comma separated)
          <input value={form.waysToHelpText} onChange={e => updateField('waysToHelpText', e.target.value)} placeholder="phone banking, deliveries, organizing, mentoring" />
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={form.openToHelp} onChange={e => updateField('openToHelp', e.target.checked)} />
          Open to helping requests right now
        </label>

        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </form>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Profile Preview</h3>
        <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <div><strong>{form.displayName || user.username}</strong></div>
          <div style={{ color: '#64748b', fontSize: 13 }}>{form.locationLabel || form.zipcode || 'Location not set'}</div>
          {form.bio && <p style={{ marginBottom: 8 }}>{form.bio}</p>}
          {offersPreview.length > 0 && <div><strong>Offers:</strong> {offersPreview.join(', ')}</div>}
          {waysPreview.length > 0 && <div><strong>Ways to help:</strong> {waysPreview.join(', ')}</div>}
          {form.contact && <div><strong>Contact:</strong> {form.contact}</div>}
          <div style={{ marginTop: 8 }}>
            <Link to={`/u/${user.id}`}>View public profile</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
