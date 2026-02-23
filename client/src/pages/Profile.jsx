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
    <div className="panel-narrow">
      <h2>Your Profile</h2>
      <p className="muted-note">
        This helps neighbors know who you are and how you can offer mutual aid.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form onSubmit={saveProfile} className="stack-lg">
        <div>
          <input value={form.displayName} onChange={e => updateField('displayName', e.target.value)} placeholder="Your display name" />
          <div className="field-help">Display name</div>
        </div>

        <div>
          <input value={form.zipcode} onChange={e => handleZipcodeChange(e.target.value)} placeholder="e.g. 98101" />
          <div className="field-help">
            Zip code {cityState && `(${cityState})`}
          </div>
          <div className="text-xs text-warning">
            You can change your location every 30 days.
          </div>
        </div>

        <div>
          <input value={form.locationLabel} onChange={e => updateField('locationLabel', e.target.value)} placeholder="Neighborhood, district, or local name" />
          <div className="field-help">Neighborhood (optional)</div>
        </div>

        <div>
          <textarea rows={4} value={form.bio} onChange={e => updateField('bio', e.target.value)} placeholder="What matters to you, your community, and what support you care about." />
          <div className="field-help">Short bio</div>
        </div>

        <div>
          <div className="section-title">How to reach you</div>
          <div className="contact-warning">
            ⚠️ Only share what you're comfortable with. Exercise caution when sharing contact information.
          </div>

          <div className="contact-row">
            <div className="contact-discord-label">
              Discord username: {user?.username || 'Not connected'}
            </div>
            <label className="checkbox-row">
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
          <div className="contact-field-wrapper">
            <input
              value={getContactValue('Signal')}
              onChange={e => setContactValue('Signal', e.target.value)}
              placeholder="Your Signal number or username"
            />
            <div className="field-help-sm">Signal</div>
          </div>

          {/* Custom fields */}
          {form.contactMethods
            .filter(m => m.label !== 'Discord' && m.label !== 'Signal')
            .map((method, idx) => {
              const actualIndex = form.contactMethods.findIndex(m => m === method)
              const isSocialLabel = ['TikTok', 'Instagram', 'Facebook', 'Twitter', 'X', 'YouTube', 'LinkedIn', 'Bluesky', 'Mastodon', 'Threads'].includes(method.label)
              return (
                <div key={actualIndex} className="contact-field-wrapper">
                  <div className="contact-method-grid">
                    <input
                      value={method.label}
                      onChange={e => updateContactMethod(actualIndex, 'label', e.target.value)}
                      placeholder="Label (e.g., Email)"
                      list="social-label-options"
                      className="contact-method-input"
                    />
                    <input
                      value={method.value}
                      onChange={e => updateContactMethod(actualIndex, 'value', e.target.value)}
                      placeholder={isSocialLabel ? "e.g., @username" : "Your contact info or profile link"}
                      className="contact-method-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeContactMethod(actualIndex)}
                      className="btn-remove-contact"
                    >
                      Remove
                    </button>
                  </div>
                  {isSocialLabel && (
                    <div className="contact-hint">
                      💡 Use @username format (e.g., @myhandle) for auto-linking
                    </div>
                  )}
                </div>
              )
            })}
          
          <button
            type="button"
            onClick={addContactMethod}
            className="contact-add-btn"
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
          <div className="autocomplete-container">
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
              className="autocomplete-input"
            />
            {skillSuggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {skillSuggestions.map(skill => (
                  <div
                    key={skill}
                    onClick={() => addSkill(skill)}
                    className="autocomplete-item"
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="chip-container">
            {form.skills.map(skill => (
              <span key={skill} className="chip-skill">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="chip-skill-close">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="chip-suggestion-container">
            {ESSENTIAL_SKILLS_BANK.filter(skill => !form.skills.includes(skill)).map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="chip-suggestion-skill"
              >
                + {skill}
              </button>
            ))}
          </div>
          <div className="field-help">Skills (click suggestions or press Enter)</div>
        </div>

        <div>
          <div className="autocomplete-container">
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
              className="autocomplete-input"
            />
            {offerSuggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {offerSuggestions.map(offer => (
                  <div
                    key={offer}
                    onClick={() => addOffer(offer)}
                    className="autocomplete-item"
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    {offer}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="chip-container">
            {form.offers.map(offer => (
              <span key={offer} className="chip-offer">
                {offer}
                <button type="button" onClick={() => removeOffer(offer)} className="chip-offer-close">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="chip-suggestion-container">
            {ESSENTIAL_OFFERS_BANK.filter(offer => !form.offers.includes(offer)).map(offer => (
              <button
                key={offer}
                type="button"
                onClick={() => addOffer(offer)}
                className="chip-suggestion-offer"
              >
                + {offer}
              </button>
            ))}
          </div>
          <div className="field-help">What you can offer (click suggestions or press Enter)</div>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.openToHelp}
            onChange={e => updateField('openToHelp', e.target.checked)}
          />
          <span>Open to help</span>
        </label>
        <div className="field-help-sm">
          People can reach out to you for help
        </div>

        <div className="profile-actions">
          <button type="submit" disabled={saving} className="profile-save-btn">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <Link to={`/u/${user.id}`} className="profile-view-link">
            View Profile
          </Link>
        </div>
      </form>
    </div>
  )
}
