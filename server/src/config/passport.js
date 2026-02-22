const DiscordStrategy = require('passport-discord').Strategy;
const refresh = require('passport-oauth2-refresh');
const User = require('../models/User');

module.exports = function(passport) {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      console.error('deserializeUser error:', err.message);
      done(err);
    }
  });

  const discordStrategy = new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const update = {
        discordId: profile.id,
        username: profile.username,
        avatar: profile.avatar,
        email: profile.email,
        accessToken,
        refreshToken: refreshToken || undefined,
        tokenUpdatedAt: new Date()
      };

      const user = await User.findOneAndUpdate(
        { discordId: profile.id },
        { $set: update, $setOnInsert: { displayName: profile.username } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

  passport.use(discordStrategy);
  refresh.use(discordStrategy);
};
