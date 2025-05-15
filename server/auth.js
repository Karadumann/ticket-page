const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const jwt = require('jsonwebtoken');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const User = {};

// Dummy user store for local auth (replace with DB in production)
const LocalUsers = {
  'admin@example.com': {
    id: 'admin1',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('adminpass', 10),
    displayName: 'Admin User',
    role: 'admin',
  },
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // TODO: Fetch user from DB
  done(null, User[id] || null);
});

passport.use(new SteamStrategy({
  returnURL: process.env.STEAM_RETURN_URL || 'http://localhost:5000/auth/steam/return',
  realm: process.env.STEAM_REALM || 'http://localhost:5000/',
  apiKey: process.env.STEAM_API_KEY,
}, (identifier, profile, done) => {
  // TODO: Find or create user in DB
  const user = {
    id: profile.id,
    displayName: profile.displayName,
    photos: profile.photos,
  };
  User[profile.id] = user;
  return done(null, user);
}));

passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  const user = LocalUsers[email];
  if (!user) return done(null, false, { message: 'Incorrect email.' });
  if (!bcrypt.compareSync(password, user.passwordHash)) return done(null, false, { message: 'Incorrect password.' });
  return done(null, user);
}));

function generateJWT(user) {
  return jwt.sign({ id: user.id, displayName: user.displayName }, process.env.SESSION_SECRET || 'dev_secret', { expiresIn: '7d' });
}

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.SESSION_SECRET || 'dev_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { passport, generateJWT, authenticateJWT, authorizeRoles }; 