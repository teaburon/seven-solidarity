const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/auth/failure'}), (req, res) => {
   res.redirect(process.env.FRONTEND_URL || '/');

  // res.json({ user: req.user }); --- IGNORE ---
});

router.get('/failure', (req, res) => res.status(401).json({ error: 'Authentication failed' }));

router.get('/logout', (req, res, next) => {
  req.logout(function(err){ if(err) return next(err); res.redirect(process.env.FRONTEND_URL || '/'); });
});

router.get('/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

module.exports = router;
