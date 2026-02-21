const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Simple US zipcode to city/state lookup (can be expanded with external API)
const ZIPCODE_DATABASE = {
  '98101': { city: 'Seattle', state: 'WA' },
  '98102': { city: 'Seattle', state: 'WA' },
  '98103': { city: 'Seattle', state: 'WA' },
  '98104': { city: 'Seattle', state: 'WA' },
  '98105': { city: 'Seattle', state: 'WA' },
  '98106': { city: 'Seattle', state: 'WA' },
  '98107': { city: 'Seattle', state: 'WA' },
  '98108': { city: 'Seattle', state: 'WA' },
  '98109': { city: 'Seattle', state: 'WA' },
  '98110': { city: 'Bainbridge Island', state: 'WA' },
  '98111': { city: 'Seattle', state: 'WA' },
  '98112': { city: 'Seattle', state: 'WA' },
  '98113': { city: 'Seattle', state: 'WA' },
  '98114': { city: 'Seattle', state: 'WA' },
  '98115': { city: 'Seattle', state: 'WA' },
  '98116': { city: 'Seattle', state: 'WA' },
  '98117': { city: 'Seattle', state: 'WA' },
  '98118': { city: 'Seattle', state: 'WA' },
  '98119': { city: 'Seattle', state: 'WA' },
  '98121': { city: 'Seattle', state: 'WA' },
  '98122': { city: 'Seattle', state: 'WA' },
  '98125': { city: 'Seattle', state: 'WA' },
  '98126': { city: 'Seattle', state: 'WA' },
  '10001': { city: 'New York', state: 'NY' },
  '10002': { city: 'New York', state: 'NY' },
  '10003': { city: 'New York', state: 'NY' },
  '10004': { city: 'New York', state: 'NY' },
  '10005': { city: 'New York', state: 'NY' },
  '10006': { city: 'New York', state: 'NY' },
  '10007': { city: 'New York', state: 'NY' },
  '90001': { city: 'Los Angeles', state: 'CA' },
  '90002': { city: 'Los Angeles', state: 'CA' },
  '60601': { city: 'Chicago', state: 'IL' },
  '60602': { city: 'Chicago', state: 'IL' }
};

function lookupCityState(zipcode) {
  const zip = String(zipcode || '').trim();
  return ZIPCODE_DATABASE[zip] || null;
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

function sanitizeProfile(user) {
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
    contactMethods: user.contactMethods || {},
    contact: user.contact || '', // Keep for backward compatibility
    offers: user.offers || [],
    waysToHelp: user.waysToHelp || [],
    openToHelp: user.openToHelp,
    createdAt: user.createdAt
  };
}

router.get('/me', ensureAuth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ profile: sanitizeProfile(user) });
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
    offers,
    waysToHelp,
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
    user.contactMethods = {};
    if (contactMethods && typeof contactMethods === 'object') {
      for (const [key, value] of Object.entries(contactMethods)) {
        user.contactMethods[key] = String(value || '').trim().slice(0, 100);
      }
    }
  }
  if (offers !== undefined) user.offers = normalizeList(offers);
  if (waysToHelp !== undefined) user.waysToHelp = normalizeList(waysToHelp);
  if (openToHelp !== undefined) user.openToHelp = Boolean(openToHelp);

  await user.save();
  res.json({ profile: sanitizeProfile(user) });
});

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ profile: sanitizeProfile(user) });
});

module.exports = router;
