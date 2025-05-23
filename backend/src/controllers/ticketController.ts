import { Request as ExpressRequest, Response } from 'express';
import Ticket from '../models/Ticket';
import Log from '../models/Log';
import { io } from '../app';
import Notification from '../models/Notification';
import { PipelineStage } from 'mongoose';

interface AuthRequest extends ExpressRequest {
  user?: any;
}

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, nickname, screenshotUrls, category, priority, labels } = req.body;
    const validCategories = ['bug', 'payment', 'account', 'suggestion', 'report_player', 'technical', 'other'];
    const validPriorities = ['low', 'medium', 'high', 'very_high'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ message: 'Category is required and must be valid.' });
    }
    if (!priority || !validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Priority is required and must be valid.' });
    }
    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
      return res.status(400).json({ message: 'In-game Nickname is required.' });
    }
    const ticket = new Ticket({
      title,
      description,
      nickname: nickname.trim(),
      screenshotUrls: Array.isArray(screenshotUrls) ? screenshotUrls.filter((url: string) => !!url) : [],
      user: req.user.id,
      category,
      priority,
      labels: Array.isArray(labels) ? labels.filter((l: string) => !!l) : [],
    });
    await ticket.save();
    io.emit('new-ticket', ticket);
    // Notify all admins (excluding the creator if admin)
    const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
    const notifications = admins
      .filter(admin => String(admin._id) !== req.user.id)
      .map(admin => ({
        user: admin._id,
        message: `A new ticket has been created: ${title}`,
        type: 'ticket_created',
        link: `/tickets/${ticket._id}`
      }));
    await Notification.insertMany(notifications);
    notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
    if (req.user) {
      await Log.create({
        user: req.user.id,
        action: 'create_ticket',
        targetType: 'ticket',
        targetId: ticket._id,
        details: { title, description, nickname, category, priority, labels: Array.isArray(labels) ? labels.filter((l: string) => !!l) : [] },
      });
    }
    const ticketId = (ticket as any)._id?.toString();
    io.to(ticketId).emit('ticket-updated', ticket);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { user: req.user.id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to as string);
    }
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).skip(skip).limit(limit),
      Ticket.countDocuments(filter)
    ]);
    res.json({ tickets, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const replyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    ticket.replies.push({ message, user: req.user.id, createdAt: new Date() });
    await ticket.save();
    // Notify ticket owner if not the replier
    if (String(ticket.user) !== req.user.id) {
      const notif = await Notification.create({
        user: ticket.user,
        message: `Your ticket received a new reply: ${ticket.title}`,
        type: 'ticket_reply',
        link: `/tickets/${ticket._id}`
      });
      io.to(String(ticket.user)).emit('notification', notif);
    }
    // Notify all admins except the replier
    const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
    const notifications = admins
      .filter(admin => String(admin._id) !== req.user.id)
      .map(admin => ({
        user: admin._id,
        message: `A ticket received a new reply: ${ticket.title}`,
        type: 'ticket_reply',
        link: `/tickets/${ticket._id}`
      }));
    await Notification.insertMany(notifications);
    notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
    if (req.user) {
      await Log.create({
        user: req.user.id,
        action: 'reply_ticket',
        targetType: 'ticket',
        targetId: ticket._id,
        details: { message },
      });
    }
    const ticketId = (ticket as any)._id?.toString();
    io.to(ticketId).emit('ticket-updated', ticket);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getAllTickets = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to as string);
    }
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).skip(skip).limit(limit).populate('assignedTo', 'username role'),
      Ticket.countDocuments(filter)
    ]);
    res.json({ tickets, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tickets.' });
  }
};

export const updateTicketStatus = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (String(ticket.user) !== req.user.id) {
      const notif = await Notification.create({
        user: ticket.user,
        message: `The status of your ticket changed to ${status}: ${ticket.title}`,
        type: 'ticket_status',
        link: `/tickets/${ticket._id}`
      });
      io.to(String(ticket.user)).emit('notification', notif);
    }
    const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
    const notifications = admins
      .filter(admin => String(admin._id) !== req.user.id)
      .map(admin => ({
        user: admin._id,
        message: `A ticket status was updated to ${status}: ${ticket.title}`,
        type: 'ticket_status',
        link: `/tickets/${ticket._id}`
      }));
    await Notification.insertMany(notifications);
    notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
    const updatedTicket = await Ticket.findById(id);
    const ticketId = (updatedTicket as any)._id?.toString();
    io.to(ticketId).emit('ticket-updated', updatedTicket);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Status update failed.' });
  }
};

export const deleteTicket = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (String(ticket.user) !== req.user.id) {
      const notif = await Notification.create({
        user: ticket.user,
        message: `Your ticket was deleted: ${ticket.title}`,
        type: 'ticket_deleted',
        link: `/tickets/${ticket._id}`
      });
      io.to(String(ticket.user)).emit('notification', notif);
    }
    const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
    const notifications = admins
      .filter(admin => String(admin._id) !== req.user.id)
      .map(admin => ({
        user: admin._id,
        message: `A ticket was deleted: ${ticket.title}`,
        type: 'ticket_deleted',
        link: `/tickets/${ticket._id}`
      }));
    await Notification.insertMany(notifications);
    notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
    if (req.user) {
      await Log.create({
        user: req.user.id,
        action: 'delete_ticket',
        targetType: 'ticket',
        targetId: id,
        details: { title: ticket.title, user: ticket.user },
      });
    }
    res.json({ message: 'Ticket deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Ticket deletion failed.' });
  }
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (String(ticket.user) !== req.user.id) return res.status(404).json({ message: 'Ticket not found.' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getTicketByIdAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('assignedTo', 'username role');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (req.user) {
      await Log.create({
        user: req.user.id,
        action: 'view_ticket',
        targetType: 'ticket',
        targetId: ticket._id,
        details: { title: ticket.title, user: ticket.user },
      });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const updateTicket = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, nickname, screenshotUrls, status, labels } = req.body;
    const update: any = {};
    if (title) {
      if (typeof title !== 'string' || title.length < 3 || title.length > 100) {
        return res.status(400).json({ message: 'Title must be between 3 and 100 characters.' });
      }
      update.title = title;
    }
    if (description) {
      if (typeof description !== 'string' || description.length < 10 || description.length > 1000) {
        return res.status(400).json({ message: 'Description must be between 10 and 1000 characters.' });
      }
      update.description = description;
    }
    if (category) {
      const validCategories = ['bug', 'payment', 'account', 'suggestion', 'report_player', 'technical', 'other'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category.' });
      }
      update.category = category;
    }
    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'very_high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority.' });
      }
      update.priority = priority;
    }
    if (nickname) {
      if (typeof nickname !== 'string' || nickname.length < 2 || nickname.length > 60) {
        return res.status(400).json({ message: 'In-game Nickname must be between 2 and 60 characters.' });
      }
      update.nickname = nickname;
    }
    if (screenshotUrls) {
      if (!Array.isArray(screenshotUrls) || screenshotUrls.some((url: any) => typeof url !== 'string')) {
        return res.status(400).json({ message: 'Screenshot URLs must be an array of strings.' });
      }
      update.screenshotUrls = screenshotUrls.filter((url: string) => !!url);
    }
    if (status) {
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
      }
      update.status = status;
    }
    if (labels) {
      if (!Array.isArray(labels) || labels.some((l: any) => typeof l !== 'string')) {
        return res.status(400).json({ message: 'Labels must be an array of strings.' });
      }
      update.labels = labels.filter((l: string) => !!l);
    }
    const ticket = await Ticket.findByIdAndUpdate(id, update, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (req.user) {
      await Log.create({
        user: req.user.id,
        action: 'update_ticket',
        targetType: 'ticket',
        targetId: id,
        details: update,
      });
    }
    const updatedTicket2 = await Ticket.findById(id);
    const ticketId = (updatedTicket2 as any)._id?.toString();
    io.to(ticketId).emit('ticket-updated', updatedTicket2);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Ticket update failed.' });
  }
};

export const submitSatisfactionSurvey = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    if (String(ticket.user) !== req.user.id) {
      return res.status(403).json({ message: 'You are not allowed to submit a survey for this ticket.' });
    }
    if (ticket.status !== 'closed') {
      return res.status(400).json({ message: 'Survey can only be submitted after the ticket is closed.' });
    }
    if (ticket.satisfactionSurvey) {
      return res.status(400).json({ message: 'Survey already submitted for this ticket.' });
    }
    ticket.satisfactionSurvey = {
      rating,
      comment: comment || '',
      submittedAt: new Date(),
    };
    await ticket.save();
    res.json({ message: 'Survey submitted successfully.', survey: ticket.satisfactionSurvey });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit survey.' });
  }
};

export const assignTicket = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ message: 'assignedTo is required.' });
    const user = await (await import('../models/User')).default.findById(assignedTo);
    if (!user || !['admin', 'superadmin', 'moderator', 'staff'].includes(user.role)) {
      return res.status(400).json({ message: 'Assigned user must be an admin, moderator, staff, or superadmin.' });
    }
    const ticket = await Ticket.findByIdAndUpdate(id, { assignedTo: user._id }, { new: true }).populate('assignedTo', 'username email role');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    // Notify assigned user
    const notif = await Notification.create({
      user: user._id,
      message: `A ticket has been assigned to you: ${ticket.title}`,
      type: 'ticket_assigned',
      link: `/tickets/${ticket._id}`
    });
    io.to(String(user._id)).emit('notification', notif);
    // Notify all admins
    const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
    const notifications = admins
      .filter(admin => String(admin._id) !== String(user._id))
      .map(admin => ({
        user: admin._id,
        message: `A ticket was assigned to ${user.username}: ${ticket.title}`,
        type: 'ticket_assigned',
        link: `/tickets/${ticket._id}`
      }));
    await Notification.insertMany(notifications);
    notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
    const updatedTicket3 = await Ticket.findById(id);
    const ticketId = (updatedTicket3 as any)._id?.toString();
    io.to(ticketId).emit('ticket-updated', updatedTicket3);
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign ticket.' });
  }
};

// Dashboard Analytics: Summary
export const getAnalyticsSummary = async (req: any, res: any) => {
  try {
    // Toplam ticket
    const total = await Ticket.countDocuments();
    // Çözülen ticket
    const resolved = await Ticket.countDocuments({ status: 'resolved' });
    // Açık, bekleyen, kapalı ticket sayısı
    const open = await Ticket.countDocuments({ status: 'open' });
    const pending = await Ticket.countDocuments({ status: 'in_progress' });
    const closed = await Ticket.countDocuments({ status: 'closed' });
    // Ortalama çözülme süresi (sadece resolved ticketlar)
    const resolvedTickets = await Ticket.find({ status: 'resolved' }, 'createdAt updatedAt');
    let avgResolution = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, t) => {
        const obj: any = t.toObject ? t.toObject() : t;
        const created = new Date(obj.createdAt).getTime();
        const updated = new Date(obj.updatedAt).getTime();
        return sum + Math.max(0, (updated - created) / (1000 * 60 * 60));
      }, 0);
      avgResolution = +(totalHours / resolvedTickets.length).toFixed(2);
    }
    // Tüm adminler için çözülen ticket sayısı
    const pipeline: PipelineStage[] = [
      { $match: { status: 'resolved', assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'admin' } },
      { $unwind: '$admin' },
      { $project: { name: '$admin.username', count: 1 } }
    ];
    const topAdmins = await Ticket.aggregate(pipeline);
    res.json({ total, resolved, avgResolution, topAdmins, open, pending, closed });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics summary.' });
  }
};

// Dashboard Analytics: Weekly Trend
export const getWeeklyTrend = async (req: any, res: any) => {
  try {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate())
      });
    }
    // Her gün için ticket sayısı
    const trend = await Promise.all(days.map(async (day, idx) => {
      const start = day.date;
      const end = new Date(day.date);
      end.setDate(end.getDate() + 1);
      const count = await Ticket.countDocuments({ createdAt: { $gte: start, $lt: end } });
      return { day: day.label, tickets: count };
    }));
    res.json({ trend });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch weekly trend.' });
  }
};

export const getCategoryDistribution = async (req: any, res: any) => {
  try {
    const categories = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch category distribution.' });
  }
};

export const getRecentSatisfactionSurveys = async (req: any, res: any) => {
  try {
    const surveys = await Ticket.find({ satisfactionSurvey: { $ne: null } }, {
      'satisfactionSurvey.rating': 1,
      'satisfactionSurvey.comment': 1,
      'satisfactionSurvey.submittedAt': 1,
      title: 1,
      _id: 1
    })
      .sort({ 'satisfactionSurvey.submittedAt': -1 })
      .limit(10)
      .lean();
    res.json({ surveys });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recent satisfaction surveys.' });
  }
};

export const getRecentLogs = async (req: any, res: any) => {
  try {
    const logs = await Log.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'username email role')
      .lean();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recent logs.' });
  }
};

// Dashboard Analytics: Ticket Status Trend (last 7 days)
export const getStatusTrend = async (req: any, res: any) => {
  try {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate())
      });
    }
    const statuses = ['open', 'in_progress', 'resolved', 'closed'];
    const trend = await Promise.all(days.map(async (day) => {
      const start = day.date;
      const end = new Date(day.date);
      end.setDate(end.getDate() + 1);
      const counts: any = { day: day.label };
      for (const status of statuses) {
        counts[status] = await Ticket.countDocuments({ status, createdAt: { $gte: start, $lt: end } });
      }
      return counts;
    }));
    res.json({ trend });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch status trend.' });
  }
};

// Dashboard Analytics: Top Users by ticket count
export const getTopUsers = async (req: any, res: any) => {
  try {
    const users = await Ticket.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 }, last: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', email: '$user.email', count: 1, last: 1 } }
    ]);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch top users.' });
  }
};

// Dashboard Analytics: Old open tickets (>7 days)
export const getOldOpenTickets = async (req: any, res: any) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const tickets = await Ticket.find({ status: 'open', createdAt: { $lt: sevenDaysAgo } }, { title: 1, createdAt: 1, _id: 1, nickname: 1 })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch old open tickets.' });
  }
}; 