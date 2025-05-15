require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { passport, generateJWT } = require('./auth');
const ticketsRouter = require('./tickets');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('Steam Ticket System API is running!');
});

// Steam OAuth2 routes
app.get('/auth/steam', passport.authenticate('steam'));

app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    // On success, send JWT
    const token = generateJWT(req.user);
    res.json({ token, user: req.user });
  }
);

app.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message || 'Login failed' });
    const token = generateJWT(user);
    res.json({ token, user });
  })(req, res, next);
});

app.use('/tickets', ticketsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 