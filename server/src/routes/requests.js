const express = require('express');
const Request = require('../models/Request');
const User = require('../models/User');

const router = express.Router();

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function ensureLocationSet(req, res, next) {
  if (req.user && req.user.state) return next();
  return res.status(403).json({ error: 'Set your location in Profile before viewing requests.' });
}

function normalizeTags(tags) {
  const list = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];

  const unique = [];
  const seen = new Set();
  for (const rawTag of list) {
    const tag = String(rawTag).trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tag);
  }
  return unique;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Create request
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { title, description, tags, requestLocation } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    let location = { city: '', state: req.user.state };
    if (requestLocation?.city && requestLocation?.state) {
      const locState = String(requestLocation.state).toUpperCase().trim();
      if (locState !== String(req.user.state).toUpperCase()) {
        return res.status(400).json({ error: 'Request location must be in your state' });
      }
      location = {
        city: String(requestLocation.city).trim(),
        state: locState
      };
    }
    
    const reqDoc = await Request.create({
      title: String(title).trim(),
      description,
      tags: normalizeTags(tags),
      author: req.user._id,
      requestLocation: location
    });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { requests: reqDoc._id } });
    res.json(reqDoc);
  } catch (err) { res.status(500).json({ error: err.message + ' error in create request' }); }
});

// Search & list with tag filter: ?q=term&tags=tag1,tag2
router.get('/', ensureAuth, ensureLocationSet, async (req, res) => {
  try {
    const { q, tags, includeClosed, status } = req.query;
    const filter = {};

    const sameStateUsers = await User.find({ state: req.user.state }, '_id').limit(5000);
    const sameStateUserIds = sameStateUsers.map(user => user._id);
    filter.author = { $in: sameStateUserIds };
    
    if (q) {
      const qRegex = new RegExp(q, 'i');
      const titleDescMatch = { $or: [ { title: qRegex }, { description: qRegex } ] };
      
      const userMatches = await User.find({ username: qRegex }, '_id').limit(100);
      const userIds = userMatches.map(u => u._id);
      
      if (userIds.length > 0) {
        filter.$or = [
          { title: qRegex },
          { description: qRegex },
          { author: { $in: userIds } }
        ];
      } else {
        Object.assign(filter, titleDescMatch);
      }
    }
    
    if (status === 'closed') filter.status = 'closed';
    else if (includeClosed !== '1') filter.status = 'open';
    if (tags) filter.tags = { $all: tags.split(',').map(t => t.trim()).filter(Boolean) };

    const list = await Request.find(filter)
      .populate('author', 'username displayName city state locationLabel zipcode')
      .limit(200);

    const sorted = list.sort((first, second) => {
      const firstCount = Array.isArray(first.responses) ? first.responses.length : 0;
      const secondCount = Array.isArray(second.responses) ? second.responses.length : 0;
      if (firstCount !== secondCount) return firstCount - secondCount;
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });

    res.json(sorted);
  } catch (err) { res.status(500).json({ error: err.message + ' error in search/list requests' }); }
});

// Tag suggestions: ?q=par
router.get('/tags', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const regex = q ? new RegExp(`^${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') : null;

    const pipeline = [
      { $unwind: '$tags' },
      ...(regex ? [{ $match: { tags: regex } }] : []),
      { $group: { _id: '$tags' } },
      { $project: { _id: 0, tag: '$_id' } },
      { $sort: { tag: 1 } },
      { $limit: 200 }
    ];

    const results = await Request.aggregate(pipeline);
    res.json(results.map(r => r.tag));
  } catch (err) {
    res.status(500).json({ error: err.message + ' error in tag suggestions' });
  }
});

// Get single
router.get('/:id', ensureAuth, ensureLocationSet, async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id)
      .populate('author', 'username displayName avatar state')
      .populate('responses.user', 'username displayName avatar')
      .populate('resolvedBy', 'username displayName');
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!doc.author?.state || String(doc.author.state).toLowerCase() !== String(req.user.state).toLowerCase()) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mentionCandidates = new Map();
    if (doc.author?._id && doc.author.username) {
      mentionCandidates.set(String(doc.author.username).toLowerCase(), {
        _id: doc.author._id,
        username: doc.author.username,
        displayName: doc.author.displayName || doc.author.username
      });
    }
    for (const response of doc.responses || []) {
      if (response?.user?._id && response?.user?.username) {
        mentionCandidates.set(String(response.user.username).toLowerCase(), {
          _id: response.user._id,
          username: response.user.username,
          displayName: response.user.displayName || response.user.username
        });
      }
    }

    const mentionPattern = /@([a-zA-Z0-9_.-]+)/g;
    const mentionedNames = new Set();
    const descriptionText = String(doc.description || '');
    let found;
    while ((found = mentionPattern.exec(descriptionText)) !== null) {
      mentionedNames.add(found[1].toLowerCase());
    }
    for (const response of doc.responses || []) {
      const responseText = String(response?.message || '');
      let matched;
      while ((matched = mentionPattern.exec(responseText)) !== null) {
        mentionedNames.add(matched[1].toLowerCase());
      }
    }

    if (mentionedNames.size > 0) {
      const usernameConditions = Array.from(mentionedNames).map(name => ({
        username: new RegExp(`^${escapeRegex(name)}$`, 'i')
      }));
      const mentionedUsers = await User.find({ $or: usernameConditions }, '_id username displayName').limit(200);
      for (const mentionedUser of mentionedUsers) {
        mentionCandidates.set(String(mentionedUser.username).toLowerCase(), {
          _id: mentionedUser._id,
          username: mentionedUser.username,
          displayName: mentionedUser.displayName || mentionedUser.username
        });
      }
    }

    const responseJson = doc.toObject();
    responseJson.mentionUsers = Array.from(mentionCandidates.values());
    res.json(responseJson);
  } catch (err) { res.status(500).json({ error: err.message + ' error in get single request' }); }
});

// Update (owner)
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!doc.author.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, tags } = req.body;
    if (title !== undefined) doc.title = String(title).trim();
    if (description !== undefined) doc.description = description;
    if (tags !== undefined) doc.tags = normalizeTags(tags);
    doc.editedAt = new Date();
    await doc.save();
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message + ' error in update request' }); }
});

// Delete (owner)
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!doc.author.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    await doc.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $pull: { requests: doc._id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message + ' error in delete request' }); }
});

// Respond to a request
router.post('/:id/respond', ensureAuth, async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    doc.responses.push({ user: req.user._id, message });
    await doc.save();
    const populated = await doc.populate('responses.user', 'username displayName');
    res.json(populated);
  } catch (err) { res.status(500).json({ error: err.message + ' error in respond to request' }); }
});

// Close request (owner only) - if no responses, delete; otherwise close and track winner
router.post('/:id/close', ensureAuth, async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!doc.author.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    if (doc.status === 'closed') return res.status(400).json({ error: 'Already closed' });

    const { winnerUserId, outsidePlatform } = req.body;
    const hasResponses = Array.isArray(doc.responses) && doc.responses.length > 0;
    
    // If no responses and canceling, delete the request
    if (!hasResponses && outsidePlatform) {
      await doc.deleteOne();
      await User.findByIdAndUpdate(req.user._id, { $pull: { requests: doc._id } });
      return res.json({ ok: true, deleted: true });
    }
    
    if (hasResponses && !outsidePlatform && !winnerUserId) {
      return res.status(400).json({ error: 'Select a user who helped or choose solved outside platform' });
    }
    
    doc.status = 'closed';
    doc.resolvedAt = new Date();
    doc.solvedOutsidePlatform = Boolean(outsidePlatform);
    
    if (winnerUserId && !outsidePlatform) {
      const winnerResponded = doc.responses.some(response => String(response.user) === String(winnerUserId));
      if (!winnerResponded) {
        return res.status(400).json({ error: 'Selected user did not respond to this request' });
      }
      doc.resolvedBy = winnerUserId;
      await User.findByIdAndUpdate(winnerUserId, { $inc: { helpedCount: 1 } });
    }
    
    await doc.save();
    const populated = await doc.populate('author responses.user resolvedBy', 'username displayName');
    res.json(populated);
  } catch (err) { res.status(500).json({ error: err.message + ' error in close request' }); }
});

// Edit response (response owner only)
router.put('/:id/respond/:responseId', ensureAuth, async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const response = doc.responses.id(req.params.responseId);
    if (!response) return res.status(404).json({ error: 'Response not found' });
    if (!response.user || String(response.user) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    response.message = String(message).trim();
    response.editedAt = new Date();
    await doc.save();

    const populated = await Request.findById(req.params.id)
      .populate('author', 'username displayName avatar')
      .populate('responses.user', 'username displayName avatar');
    res.json(populated);
  } catch (err) { res.status(500).json({ error: err.message + ' error in edit response' }); }
});

module.exports = router;
