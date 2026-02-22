import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, put } from '../api'

const ESSENTIAL_SKILLS_BANK = [
  'ice fishing',
  'gardening',
  'phone banking',
  'organizing',
  'teaching'
]

const ESSENTIAL_OFFERS_BANK = [
  'rides',
  'groceries',
  'translation',
  'childcare',
  'pet sitting'
]

const POPULAR_SOCIAL_LABELS = [
  'TikTok',
  'Instagram',
  'Facebook',
  'X / Twitter',
  'YouTube',
  'LinkedIn',
  'WhatsApp',
  'Telegram',
  'Signal',
  'Website'
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
  const [offerSuggestions, setOfferSuggestions] = useState([])
  const [availableOffers, setAvailableOffers] = useState([])
  const [form, setForm] = useState({
    displayName: '',
    zipcode: '',
    locationLabel: '',
    bio: '',
    contactMethods: [],
    allowDiscordContact: false,
    skills: [],
    skillsInput: '',
    offers: [],
    offersInput: '',
    openToHelp: true
  })

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    loadProfile()
    loadAvailableSkills()
    loadAvailableOffers()
  }, [user, navigate])

  async function loadAvailableSkills() {
    try {
      const data = await get('/profile/agg/skills')
      setAvailableSkills(data.skills || [])
    } catch (err) {
      console.error('Failed to load skills:', err.message)
    }
  }

  async function loadAvailableOffers() {
    try {
      const data = await get('/profile/agg/offers')
      setAvailableOffers(data.offers || [])
    } catch (err) {
      console.error('Failed to load offers:', err.message)
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
        contactMethods: profile.contactMethods || [],
        allowDiscordContact: profile.allowDiscordContact || false,
        skills: profile.skills || [],
        skillsInput: '',
        offers: profile.offers || [],
        offersInput: '',
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

  function updateContactMethod(index, field, value) {
    setForm(prev => {
      const updated = [...prev.contactMethods]
      if (!updated[index]) updated[index] = { label: '', value: '' }
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, contactMethods: updated }
    })
  }

  function addContactMethod() {
    setForm(prev => ({
      ...prev,
      contactMethods: [...prev.contactMethods, { label: '', value: '' }]
    }))
  }

  function removeContactMethod(index) {
    setForm(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.filter((_, i) => i !== index)
    }))
  }

  function getContactValue(label) {
    const method = form.contactMethods.find(m => m.label === label)
    return method ? method.value : ''
  }

  function setContactValue(label, value) {
    setForm(prev => {
      const index = prev.contactMethods.findIndex(m => m.label === label)
      if (index >= 0) {
        const updated = [...prev.contactMethods]
        if (value) {
          updated[index] = { label, value }
        } else {
          updated.splice(index, 1)
        }
        return { ...prev, contactMethods: updated }
      } else if (value) {
        return { ...prev, contactMethods: [...prev.contactMethods, { label, value }] }
      }
      return prev
    })
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
      const source = Array.from(new Set([...ESSENTIAL_SKILLS_BANK, ...availableSkills]))
      const suggestions = source
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

  function handleOffersInput(value) {
    updateField('offersInput', value)
    // Filter suggestions
    if (value.trim()) {
      const query = value.toLowerCase()
      const source = Array.from(new Set([...ESSENTIAL_OFFERS_BANK, ...availableOffers]))
      const suggestions = source
        .filter(offer => offer.toLowerCase().includes(query) && !form.offers.includes(offer))
        .slice(0, 5)
      setOfferSuggestions(suggestions)
    } else {
      setOfferSuggestions([])
    }
  }

  function addOffer(offer) {
    const trimmed = String(offer || '').trim()
    if (trimmed && !form.offers.includes(trimmed)) {
      setForm(prev => ({
        ...prev,
        offers: [...prev.offers, trimmed],
        offersInput: ''
      }))
      setOfferSuggestions([])
    }
  }

  function removeOffer(offerToRemove) {
    setForm(prev => ({
      ...prev,
      offers: prev.offers.filter(o => o !== offerToRemove)
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
        allowDiscordContact: form.allowDiscordContact,
        skills: form.skills,
        offers: form.offers,
        openToHelp: form.openToHelp
      }

      const data = await put('/profile/me', payload)
      const updated = data.profile

      setForm(prev => ({
        ...prev,
        skills: updated.skills || [],
        offers: updated.offers || []
      }))
      setCityState(updated.city && updated.state ? `${updated.city}, ${updated.state}` : '')

      if (setUser && user) {
        setUser({
          ...user,
          displayName: updated.displayName,
          openToHelp: updated.openToHelp,
          zipcode: updated.zipcode,
          city: updated.city,
          state: updated.state,
          locationUpdatedAt: updated.locationUpdatedAt || null
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
          <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>
            You can change your location every 30 days.
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
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontStyle: 'italic' }}>
            ⚠️ Only share what you're comfortable with. Exercise caution when sharing contact information.
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
              Discord username: {user?.username || 'Not connected'}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.allowDiscordContact}
                onChange={e => updateField('allowDiscordContact', e.target.checked)}
                disabled={!user?.username}
              />
              <span>Allow contact via Discord</span>
            </label>
          </div>

          {/* Signal field */}
          <div style={{ marginBottom: 10 }}>
            <input
              value={getContactValue('Signal')}
              onChange={e => setContactValue('Signal', e.target.value)}
              placeholder="Your Signal number or username"
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Signal</div>
          </div>

          {/* Custom fields */}
          {form.contactMethods
            .filter(m => m.label !== 'Discord' && m.label !== 'Signal')
            .map((method, idx) => {
              const actualIndex = form.contactMethods.findIndex(m => m === method)
              const isSocialLabel = ['TikTok', 'Instagram', 'Facebook', 'Twitter', 'X', 'YouTube', 'LinkedIn', 'Bluesky', 'Mastodon', 'Threads'].includes(method.label)
              return (
                <div key={actualIndex} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'start' }}>
                    <input
                      value={method.label}
                      onChange={e => updateContactMethod(actualIndex, 'label', e.target.value)}
                      placeholder="Label (e.g., Email)"
                      list="social-label-options"
                      style={{ fontSize: 13 }}
                    />
                    <input
                      value={method.value}
                      onChange={e => updateContactMethod(actualIndex, 'value', e.target.value)}
                      placeholder={isSocialLabel ? "e.g., @username" : "Your contact info or profile link"}
                      style={{ fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeContactMethod(actualIndex)}
                      style={{ padding: '6px 10px', background: '#fee', color: '#c00', border: '1px solid #fcc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      Remove
                    </button>
                  </div>
                  {isSocialLabel && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      💡 Use @username format (e.g., @myhandle) for auto-linking
                    </div>
                  )}
                </div>
              )
            })}
          
          <button
            type="button"
            onClick={addContactMethod}
            style={{ marginTop: 8, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#2563eb' }}
          >
            + Add field
          </button>
          <datalist id="social-label-options">
            {POPULAR_SOCIAL_LABELS.map(label => (
              <option key={label} value={label} />
            ))}
          </datalist>
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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {ESSENTIAL_SKILLS_BANK.filter(skill => !form.skills.includes(skill)).map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                style={{
                  padding: '4px 10px',
                  border: '1px dashed #93c5fd',
                  background: '#eff6ff',
                  borderRadius: 999,
                  fontSize: 12,
                  color: '#1d4ed8',
                  cursor: 'pointer'
                }}
              >
                + {skill}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Skills (click suggestions or press Enter)</div>
        </div>

        <div>
          <div style={{ position: 'relative' }}>
            <input
              value={form.offersInput}
              onChange={e => handleOffersInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addOffer(form.offersInput)
                }
              }}
              placeholder="Type what you can offer (e.g., rides, groceries, childcare)"
              style={{ width: '100%' }}
            />
            {offerSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 6px 6px', zIndex: 10 }}>
                {offerSuggestions.map(offer => (
                  <div
                    key={offer}
                    onClick={() => addOffer(offer)}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', hover: { background: '#f8fafc' } }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    {offer}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {form.offers.map(offer => (
              <span key={offer} style={{ padding: '4px 10px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 999, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                {offer}
                <button type="button" onClick={() => removeOffer(offer)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 14, color: '#f59e0b' }}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {ESSENTIAL_OFFERS_BANK.filter(offer => !form.offers.includes(offer)).map(offer => (
              <button
                key={offer}
                type="button"
                onClick={() => addOffer(offer)}
                style={{
                  padding: '4px 10px',
                  border: '1px dashed #facc15',
                  background: '#fefce8',
                  borderRadius: 999,
                  fontSize: 12,
                  color: '#a16207',
                  cursor: 'pointer'
                }}
              >
                + {offer}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>What you can offer (click suggestions or press Enter)</div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.openToHelp}
            onChange={e => updateField('openToHelp', e.target.checked)}
          />
          <span>Open to help</span>
        </label>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          People can reach out to you for help
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <Link to={`/u/${user.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
            View Profile
          </Link>
        </div>
      </form>
    </div>
  )
}
