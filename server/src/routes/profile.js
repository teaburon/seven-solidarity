const express = require('express');
const User = require('../models/User');

const router = express.Router();

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
    locationLabel: user.locationLabel || '',
    bio: user.bio || '',
    contact: user.contact || '',
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
    contact,
    offers,
    waysToHelp,
    openToHelp
  } = req.body;

  if (displayName !== undefined) user.displayName = String(displayName || '').trim().slice(0, 50);
  if (zipcode !== undefined) user.zipcode = String(zipcode || '').trim().slice(0, 10);
  if (locationLabel !== undefined) user.locationLabel = String(locationLabel || '').trim().slice(0, 80);
  if (bio !== undefined) user.bio = String(bio || '').trim().slice(0, 500);
  if (contact !== undefined) user.contact = String(contact || '').trim().slice(0, 200);
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
