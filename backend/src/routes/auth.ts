import { Router } from 'express';
import { register, login } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Response } from 'express';
import { IUser } from '../models/User';

const router = Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

router.post('/register', register);
router.post('/login', login);

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const update: Partial<IUser> = {};
    if (req.body.username) update.username = req.body.username;
    if (req.body.email) update.email = req.body.email;
    if (req.body.avatar !== undefined) update.avatar = req.body.avatar;
    if (req.body.notificationPreferences !== undefined) update.notificationPreferences = req.body.notificationPreferences;
    if (req.body.password && req.body.newPassword) {
      const user = await User.findById(req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });
      if (req.body.newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      update.password = await bcrypt.hash(req.body.newPassword, 10);
    }
    const user = await User.findByIdAndUpdate(req.user?.id, update, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/discord/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send('No code provided');

  try {
    const params = new URLSearchParams();
    params.append('client_id', DISCORD_CLIENT_ID!);
    params.append('client_secret', DISCORD_CLIENT_SECRET!);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', DISCORD_REDIRECT_URI!);
    params.append('scope', 'identify guilds');

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const discordUser = userRes.data; // { id, username, ... }

    let token = req.query.state as string;
    let userId = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        userId = decoded.id;
      } catch {}
    }
    if (!userId) return res.status(401).send('Not authenticated');

    await User.findByIdAndUpdate(userId, {
      discordId: discordUser.id,
      discordUsername: discordUser.username
    });

    res.send('Discord account connected! You can close this window.');
  } catch (err) {
    const error = err as any;
    res.status(500).send('Discord authentication failed');
  }
});

router.post('/me/discord-mute', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { duration } = req.body; // duration in minutes, or 'forever'
    let muteUntil: Date | null = null;
    if (duration && duration !== 'forever') {
      muteUntil = new Date(Date.now() + parseInt(duration) * 60 * 1000);
    }
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        'notificationPreferences.discordMuted': true,
        'notificationPreferences.discordMuteUntil': duration === 'forever' ? null : muteUntil
      },
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'Discord notifications muted.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mute Discord notifications.' });
  }
});

router.post('/me/discord-unmute', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        'notificationPreferences.discordMuted': false,
        'notificationPreferences.discordMuteUntil': null
      },
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'Discord notifications unmuted.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unmute Discord notifications.' });
  }
});

export default router; 