require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');

const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();
app.use(express.json());
const allowedOrigins = [
  'http://localhost:5173',
  'https://seven-solidarity.vercel.app'
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Copy .env.example to .env and set MONGO_URI');
  process.exit(1);
}

mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI, {
  // increase selection timeout for slow networks / initial DNS lookup
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:');
    console.error(err);
    console.error('Tips: verify `MONGO_URI`, network access (Atlas IP whitelist), and DNS for SRV records.');
    process.exit(1);
  });

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in prod, 'lax' for localhost
    secure: isProduction // secure cookies only in production (HTTPS)
  }
}));

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/requests', requestRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
