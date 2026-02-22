const express = require('express');
const User = require('../models/User');
const Request = require('../models/Request');
const zipcodes = require('../data/zipcodes.json');

const router = express.Router();

// Build zipcode lookup map
const ZIPCODE_MAP = new Map();
for (const entry of zipcodes) {
  const zip = String(entry.zip_code).padStart(5, '0');
  ZIPCODE_MAP.set(zip, { city: entry.city, state: entry.state });
}

function lookupCityState(zipcode) {
  const zip = String(zipcode || '').trim().padStart(5, '0');
  return ZIPCODE_MAP.get(zip) || null;
}

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function normalizeList(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const unique = [];
  const seen = new Set();
  for (const rawItem of list) {
    const item = String(rawItem).trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function sanitizeProfile(user, requests) {
  if (!user) return null;
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar,
    zipcode: user.zipcode || '',
    city: user.city || '',
    state: user.state || '',
    locationLabel: user.locationLabel || '',
    bio: user.bio || '',
    contactMethods: user.contactMethods || [],
    allowDiscordContact: user.allowDiscordContact || false,
    skills: user.skills || [],
    offers: user.offers || [],
    openToHelp: user.openToHelp,
    requests: Array.isArray(requests) ? requests : (user.requests || []),
    createdAt: user.createdAt
  };
}

async function loadUserRequests(userId) {
  const requests = await Request.find({ author: userId }).limit(200);
  return requests.sort((first, second) => {
    const firstCount = Array.isArray(first.responses) ? first.responses.length : 0;
    const secondCount = Array.isArray(second.responses) ? second.responses.length : 0;
    if (firstCount !== secondCount) return firstCount - secondCount;
    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  });
}

router.get('/me', ensureAuth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const requests = await loadUserRequests(user._id);
  res.json({ profile: sanitizeProfile(user, requests) });
});

router.put('/me', ensureAuth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const {
    displayName,
    zipcode,
    locationLabel,
    bio,
    contactMethods,
    allowDiscordContact,
    skills,
    offers,
    openToHelp
  } = req.body;

  if (displayName !== undefined) user.displayName = String(displayName || '').trim().slice(0, 50);
  if (zipcode !== undefined) {
    user.zipcode = String(zipcode || '').trim().slice(0, 10);
    // Auto-lookup city and state from zipcode
    const lookup = lookupCityState(user.zipcode);
    if (lookup) {
      user.city = lookup.city;
      user.state = lookup.state;
    } else {
      user.city = '';
      user.state = '';
    }
  }
  if (locationLabel !== undefined) user.locationLabel = String(locationLabel || '').trim().slice(0, 80);
  if (bio !== undefined) user.bio = String(bio || '').trim().slice(0, 500);
  if (contactMethods !== undefined) {
    user.contactMethods = [];
    if (Array.isArray(contactMethods)) {
      user.contactMethods = contactMethods
        .filter(method => method && method.label && method.value)
        .map(method => ({
          label: String(method.label).trim().slice(0, 50),
          value: String(method.value).trim().slice(0, 100)
        }));
    }
  }
  if (allowDiscordContact !== undefined) user.allowDiscordContact = Boolean(allowDiscordContact);
  if (skills !== undefined) user.skills = normalizeList(skills);
  if (offers !== undefined) user.offers = normalizeList(offers);
  if (openToHelp !== undefined) user.openToHelp = Boolean(openToHelp);

  await user.save();
  const requests = await loadUserRequests(user._id);
  res.json({ profile: sanitizeProfile(user, requests) });
});

// Zipcode lookup endpoint
router.get('/lookup/city-state/:zipcode', (req, res) => {
  const lookup = lookupCityState(req.params.zipcode);
  if (lookup) {
    res.json({ city: lookup.city, state: lookup.state });
  } else {
    res.json({ city: '', state: '' });
  }
});

// Public profile GET - must be after '/lookup/' to avoid conflicts
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const requests = await loadUserRequests(user._id);
  res.json({ profile: sanitizeProfile(user, requests) });
});

// Skills aggregation endpoint - returns all unique skills across all users
router.get('/agg/skills', async (req, res) => {
  try {
    const result = await User.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: null, skills: { $addToSet: '$skills' } } },
      { $project: { skills: { $sort: '$skills' } } }
    ]);
    const skills = result[0]?.skills || [];
    res.json({ skills });
  } catch (err) {
    res.json({ skills: [] });
  }
});

// Offers aggregation endpoint - returns all unique offers across all users
router.get('/agg/offers', async (req, res) => {
  try {
    const result = await User.aggregate([
      { $unwind: '$offers' },
      { $group: { _id: null, offers: { $addToSet: '$offers' } } },
      { $project: { offers: { $sort: '$offers' } } }
    ]);
    const offers = result[0]?.offers || [];
    res.json({ offers });
  } catch (err) {
    res.json({ offers: [] });
  }
});

module.exports = router;
