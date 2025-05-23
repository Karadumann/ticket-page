import { Router } from 'express';
import { getAllUsers, changeUserPassword, updateUser, deleteUser } from '../controllers/authController';
import { getAllTickets, updateTicketStatus, deleteTicket, getTicketByIdAdmin, updateTicket, assignTicket, getAnalyticsSummary, getWeeklyTrend } from '../controllers/ticketController';
import authMiddleware, { requireAdmin, requireSuperAdmin } from '../middlewares/authMiddleware';
import { getLogs, deleteAllLogs } from '../controllers/logController';
import Notification from '../models/Notification';
import Log from '../models/Log';
import { getOnlineAdmins } from '../utils/onlineAdmins';
import User from '../models/User';

const router = Router();

router.get('/users', authMiddleware, requireAdmin, getAllUsers);
router.get('/tickets', authMiddleware, requireAdmin, getAllTickets);
router.get('/tickets/:id', authMiddleware, requireAdmin, getTicketByIdAdmin);
router.patch('/users/:id/password', authMiddleware, requireAdmin, changeUserPassword);
router.patch('/tickets/:id/status', authMiddleware, requireAdmin, updateTicketStatus);
router.patch('/tickets/:id', authMiddleware, requireAdmin, updateTicket);
router.patch('/tickets/:id/assign', authMiddleware, requireAdmin, assignTicket);
router.delete('/tickets/:id', authMiddleware, requireAdmin, deleteTicket);
router.patch('/users/:id', authMiddleware, requireAdmin, updateUser);
router.delete('/users/:id', authMiddleware, requireAdmin, deleteUser);
router.get('/logs', authMiddleware, requireAdmin, getLogs);
router.delete('/logs', authMiddleware, requireSuperAdmin, deleteAllLogs);

// Notification endpoints
router.get('/notifications', authMiddleware, requireAdmin, async (req: any, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});
router.patch('/notifications/:id/read', authMiddleware, requireAdmin, async (req: any, res) => {
  try {
    const notif = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true });
    if (!notif) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification: notif });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification.' });
  }
});

router.get('/tickets/:id/logs', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const logs = await Log.find({ targetType: 'ticket', targetId: req.params.id }).sort({ timestamp: -1 }).populate('user', 'username email role');
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch ticket logs.' });
  }
});

// Online admins endpoint
router.get('/online-admins', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { getOnlineAdmins } = require('../utils/onlineAdmins');
    const ids = getOnlineAdmins();
    if (!ids.length) return res.json({ admins: [] });
    const User = (await import('../models/User')).default;
    const admins = await User.find({ _id: { $in: ids } }, 'username email role');
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch online admins.' });
  }
});

router.get('/analytics/summary', authMiddleware, requireAdmin, getAnalyticsSummary);
router.get('/analytics/weekly-trend', authMiddleware, requireAdmin, getWeeklyTrend);

export default router; 