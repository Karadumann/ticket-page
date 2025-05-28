import { Router } from 'express';
import { register, login } from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.patch('/me', authMiddleware, async (req: any, res) => {
  try {
    const update: any = {};
    if (req.body.username) update.username = req.body.username;
    if (req.body.email) update.email = req.body.email;
    if (req.body.avatar !== undefined) update.avatar = req.body.avatar;
    if (req.body.notificationPreferences !== undefined) update.notificationPreferences = req.body.notificationPreferences;
    if (req.body.password && req.body.newPassword) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });
      if (req.body.newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      update.password = await bcrypt.hash(req.body.newPassword, 10);
    }
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router; 