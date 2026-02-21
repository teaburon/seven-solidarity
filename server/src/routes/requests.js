const express = require('express');
const Request = require('../models/Request');

const router = express.Router();

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized' });
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

// Create request
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const reqDoc = await Request.create({
      title: String(title).trim(),
      description,
      tags: normalizeTags(tags),
      author: req.user._id
    });
    res.json(reqDoc);
  } catch (err) { res.status(500).json({ error: err.message + ' error in create request' }); }
});

// Search & list with tag filter: ?q=term&tags=tag1,tag2
router.get('/', async (req, res) => {
  try {
    const { q, tags } = req.query;
    const filter = {};
    if (q) filter.$or = [ { title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') } ];
    if (tags) filter.tags = { $all: tags.split(',').map(t => t.trim()).filter(Boolean) };

    const list = await Request.find(filter)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(list);
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
router.get('/:id', async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate('responses.user', 'username avatar');
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
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
    const populated = await doc.populate('responses.user', 'username');
    res.json(populated);
  } catch (err) { res.status(500).json({ error: err.message + ' error in respond to request' }); }
});

module.exports = router;
