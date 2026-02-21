const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', (req, res, next) => {
  passport.authenticate('discord', (err, user) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/auth/failure`);
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.redirect(`${FRONTEND_URL}?auth_token=${token}`);
  })(req, res, next);
});

// Exchange JWT token for session cookie
router.post('/exchange-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    req.session.passport = { user: user._id };
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err.message);
        return res.status(500).json({ error: 'Session save failed' });
      }
      res.json({ user });
    });
  } catch (err) {
    console.error('Token exchange error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/failure', (req, res) => res.status(401).json({ error: 'Authentication failed' }));

router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid', {
        path: '/',
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        partitioned: true
      });
      res.redirect(FRONTEND_URL);
    });
  });
});

router.get('/me', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

module.exports = router;
