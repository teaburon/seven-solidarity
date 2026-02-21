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

const CONTACT_METHODS = [
  { key: 'discord', label: 'Discord' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'signal', label: 'Signal' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'other', label: 'Other' }
]

export default function Profile({ user, setUser }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cityState, setCityState] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [availableSkills, setAvailableSkills] = useState([])
  const [form, setForm] = useState({
    displayName: '',
    zipcode: '',
    locationLabel: '',
    bio: '',
    contactMethods: {},
    skills: [],
    skillsInput: '',
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
    loadAvailableSkills()
  }, [user, navigate])

  async function loadAvailableSkills() {
    try {
      const data = await get('/profile/agg/skills')
      setAvailableSkills(data.skills || [])
    } catch (err) {
      console.error('Failed to load skills:', err.message)
    }
  }

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
        contactMethods: profile.contactMethods || {},
        skills: profile.skills || [],
        skillsInput: '',
        offersText: listToText(profile.offers),
        waysToHelpText: listToText(profile.waysToHelp),
        openToHelp: profile.openToHelp !== false
      })
      setCityState(profile.city && profile.state ? `${profile.city}, ${profile.state}` : '')
    } catch (err) {
      setError('Failed to load profile: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateContactMethod(method, value) {
    setForm(prev => ({
      ...prev,
      contactMethods: { ...prev.contactMethods, [method]: value }
    }))
  }

  function handleZipcodeChange(zipcode) {
    updateField('zipcode', zipcode)
    // Live lookup city/state
    if (zipcode.length >= 5) {
      get(`/profile/lookup/city-state/${zipcode}`)
        .then(data => {
          if (data.city && data.state) {
            setCityState(`${data.city}, ${data.state}`)
          } else {
            setCityState('')
          }
        })
        .catch(() => setCityState(''))
    } else {
      setCityState('')
    }
  }

  function handleSkillsInput(value) {
    updateField('skillsInput', value)
    // Filter suggestions
    if (value.trim()) {
      const query = value.toLowerCase()
      const suggestions = availableSkills
        .filter(skill => skill.toLowerCase().includes(query) && !form.skills.includes(skill))
        .slice(0, 5)
      setSkillSuggestions(suggestions)
    } else {
      setSkillSuggestions([])
    }
  }

  function addSkill(skill) {
    const trimmed = String(skill || '').trim()
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed],
        skillsInput: ''
      }))
      setSkillSuggestions([])
    }
  }

  function removeSkill(skillToRemove) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }))
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
        contactMethods: form.contactMethods,
        skills: form.skills,
        offers: textToUniqueList(form.offersText),
        waysToHelp: textToUniqueList(form.waysToHelpText),
        openToHelp: form.openToHelp
      }

      const data = await put('/profile/me', payload)
      const updated = data.profile

      setForm(prev => ({
        ...prev,
        offersText: listToText(updated.offers),
        waysToHelpText: listToText(updated.waysToHelp),
        skills: updated.skills || []
      }))
      setCityState(updated.city && updated.state ? `${updated.city}, ${updated.state}` : '')

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

      <form onSubmit={saveProfile} style={{ display: 'grid', gap: 16 }}>
        <div>
          <input value={form.displayName} onChange={e => updateField('displayName', e.target.value)} placeholder="Your display name" />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Display name</div>
        </div>

        <div>
          <input value={form.zipcode} onChange={e => handleZipcodeChange(e.target.value)} placeholder="e.g. 98101" />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Zip code {cityState && `(${cityState})`}
          </div>
        </div>

        <div>
          <input value={form.locationLabel} onChange={e => updateField('locationLabel', e.target.value)} placeholder="Neighborhood, district, or local name" />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Neighborhood (optional)</div>
        </div>

        <div>
          <textarea rows={4} value={form.bio} onChange={e => updateField('bio', e.target.value)} placeholder="What matters to you, your community, and what support you care about." />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Short bio</div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>How to reach you</div>
          {CONTACT_METHODS.map(method => (
            <div key={method.key} style={{ marginBottom: 10 }}>
              <input
                value={form.contactMethods[method.key] || ''}
                onChange={e => updateContactMethod(method.key, e.target.value)}
                placeholder={`Your ${method.label.toLowerCase()}`}
              />
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{method.label}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ position: 'relative' }}>
            <input
              value={form.skillsInput}
              onChange={e => handleSkillsInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill(form.skillsInput)
                }
              }}
              placeholder="Type a skill (e.g., carpentry, cooking, tech support)"
              style={{ width: '100%' }}
            />
            {skillSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 6px 6px', zIndex: 10 }}>
                {skillSuggestions.map(skill => (
                  <div
                    key={skill}
                    onClick={() => addSkill(skill)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', hover: { background: '#f8fafc' } }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {form.skills.map(skill => (
              <span key={skill} style={{ padding: '4px 10px', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 999, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 14, color: '#3b82f6' }}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Skills (click suggestions or press Enter)</div>
        </div>

        <div>
          <input value={form.offersText} onChange={e => updateField('offersText', e.target.value)} placeholder="rides, groceries, translation, childcare" />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>What you can offer (comma separated)</div>
        </div>

        <div>
          <input value={form.waysToHelpText} onChange={e => updateField('waysToHelpText', e.target.value)} placeholder="phone banking, deliveries, organizing, mentoring" />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Ways you can help (comma separated)</div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.openToHelp}
            onChange={e => updateField('openToHelp', e.target.checked)}
          />
          <span>Open to helping requests right now</span>
        </label>

        <button type="submit" disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Profile Preview</h3>
        <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <div><strong>{form.displayName || user.username}</strong></div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>
            {form.locationLabel && `${form.locationLabel} `}
            {cityState && `(${cityState})`}
            {!form.locationLabel && !cityState && 'Location not set'}
          </div>
          {form.bio && <p style={{ marginBottom: 8 }}>{form.bio}</p>}
          {offersPreview.length > 0 && <div style={{ marginBottom: 6 }}><strong>Offers:</strong> {offersPreview.join(', ')}</div>}
          {waysPreview.length > 0 && <div style={{ marginBottom: 6 }}><strong>Ways to help:</strong> {waysPreview.join(', ')}</div>}
          {form.skills.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <strong>Skills:</strong>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {form.skills.map(skill => (
                  <span key={skill} style={{ padding: '4px 10px', background: '#f3e8ff', borderRadius: 999, fontSize: 12 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {Object.values(form.contactMethods).some(v => v) && (
            <div style={{ marginBottom: 8 }}>
              <strong>Contact:</strong>
              <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                {CONTACT_METHODS.map(method =>
                  form.contactMethods[method.key] && (
                    <li key={method.key} style={{ fontSize: 13 }}>
                      {method.label}: {form.contactMethods[method.key]}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <Link to={`/u/${user.id}`}>View public profile</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
