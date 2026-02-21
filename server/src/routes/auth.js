const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', (req, res, next) => {
  console.log('OAuth callback started, session ID:', req.sessionID);
  passport.authenticate('discord', (err, user) => {
    console.log('Passport strategy returned:', err ? err.message : 'ok', 'user:', user ? user.username : 'none');
    if (err || !user) {
      return res.redirect('/auth/failure');
    }
    req.logIn(user, { keepSessionInfo: true }, loginErr => {
      console.log('req.logIn returned:', loginErr ? loginErr.message : 'ok', 'final session ID:', req.sessionID);
      if (loginErr) return next(loginErr);
      req.session.save(saveErr => {
        if (saveErr) {
          console.error('Session save error:', saveErr.message);
          return next(saveErr);
        }
        console.log('Session saved, redirecting to:', process.env.FRONTEND_URL);
        const redirectUrl = process.env.FRONTEND_URL || '/';
        res
          .status(200)
          .set('Content-Type', 'text/html; charset=utf-8')
          .set('Cache-Control', 'no-store')
          .send(`<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head><body><script>window.location.replace(${JSON.stringify(redirectUrl)});</script>Redirecting...</body></html>`);
      });
    });
  })(req, res, next);
});

router.get('/failure', (req, res) => res.status(401).json({ error: 'Authentication failed' }));

router.get('/logout', (req, res, next) => {
  req.logout(function(err){
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid', {
        path: '/',
        sameSite: 'none',
        secure: true,
        httpOnly: true
      });
      res.redirect(process.env.FRONTEND_URL || '/');
    });
  });
});

router.get('/me', (req, res) => {
  console.log('GET /auth/me - session:', req.sessionID, 'user:', req.user ? req.user.username : 'NONE', 'isAuth:', req.isAuthenticated?.());
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

module.exports = router;
