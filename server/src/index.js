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
app.use(cors({ 
    origin: [FRONTEND_URL], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
}));

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

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }) ,
  cookie: { 
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 60 * 60 * 24 } // 30 days
}));

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/requests', requestRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
