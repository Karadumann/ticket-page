import Ticket from '../models/Ticket';
import Log from '../models/Log';
import Notification from '../models/Notification';
import { io } from '../app';
import { sendMail } from '../utils/sendMail';
import { sendDiscordMessage } from '../utils/sendDiscordMessage';

export const createTicketService = async (data: any, user: any) => {
  const { title, description, nickname, screenshotUrls, category, priority, labels } = data;
  const ticket = new Ticket({
    title,
    description,
    nickname: nickname.trim(),
    screenshotUrls: Array.isArray(screenshotUrls) ? screenshotUrls.filter((url: string) => !!url) : [],
    user: user.id,
    category,
    priority,
    labels: Array.isArray(labels) ? labels.filter((l: string) => !!l) : [],
  });
  await ticket.save();
  io.emit('new-ticket', ticket);
  // Notify all admins (excluding the creator if admin)
  const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
  const notifications = admins
    .filter(admin => String(admin._id) !== user.id)
    .map(admin => ({
      user: admin._id,
      message: `A new ticket has been created: ${title}`,
      type: 'ticket_created',
      link: `/tickets/${ticket._id}`
    }));
  await Notification.insertMany(notifications);
  notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
  if (user) {
    await Log.create({
      user: user.id,
      action: 'create_ticket',
      targetType: 'ticket',
      targetId: ticket._id,
      details: { ticketId: ticket._id, title, description, nickname, category, priority, labels: Array.isArray(labels) ? labels.filter((l: string) => !!l) : [] },
    });
  }
  const ticketId = (ticket as any)._id?.toString();
  io.to(ticketId).emit('ticket-updated', ticket);
  if (user) {
    const userDoc = await (await import('../models/User')).default.findById(user.id);
    const muted = userDoc?.notificationPreferences?.discordMuted;
    const muteUntil = userDoc?.notificationPreferences?.discordMuteUntil;
    const now = new Date();
    const isMuted = muted && (!muteUntil || new Date(muteUntil) > now);
    if (userDoc && userDoc.notificationPreferences?.discord && userDoc.discordId && !isMuted) {
      const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tickets/${ticket._id}`;
      sendDiscordMessage(userDoc.discordId, {
        type: 'created',
        description: `Your ticket **${ticket.title}** has been created.`,
        url,
        buttonLabel: 'View Ticket',
        timestamp: ticket.createdAt || new Date(),
        ticketId: ticket._id?.toString(),
        category: ticket.category,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        avatarUrl: userDoc.avatar || undefined
      }).catch(() => {});
    }
  }
  return ticket;
};

export const replyTicketService = async (ticketId: string, message: string, user: any) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error('Ticket not found.');
  ticket.replies.push({ message, user: user.id, createdAt: new Date() });
  await ticket.save();
  // Notify ticket owner if not the replier
  if (String(ticket.user) !== user.id) {
    const notif = await Notification.create({
      user: ticket.user,
      message: `Your ticket received a new reply: ${ticket.title}`,
      type: 'ticket_reply',
      link: `/tickets/${ticket._id}`
    });
    io.to(String(ticket.user)).emit('notification', notif);
    // Bildirim tercihlerine göre e-posta/discord/telegram gönder
    const ticketOwner = await (await import('../models/User')).default.findById(ticket.user);
    if (ticketOwner && ticketOwner.notificationPreferences) {
      const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tickets/${ticket._id}`;
      if (ticketOwner.notificationPreferences.email && ticketOwner.email) {
        sendMail({
          to: ticketOwner.email,
          subject: 'Your ticket received a new reply',
          text: `Your ticket "${ticket.title}" received a new reply.\n\nView: ${url}`
        }).catch(() => {});
      }
      if (ticketOwner.notificationPreferences.discord && ticketOwner.discordId) {
        const muted = ticketOwner?.notificationPreferences?.discordMuted;
        const muteUntil = ticketOwner?.notificationPreferences?.discordMuteUntil;
        const now = new Date();
        const isMuted = muted && (!muteUntil || new Date(muteUntil) > now);
        if (!isMuted) {
          const replier = await (await import('../models/User')).default.findById(user.id);
          sendDiscordMessage(ticketOwner.discordId, {
            type: 'reply',
            description: `**${replier?.username || 'Someone'}** replied to your ticket **${ticket.title}**.\n\nTo see the reply, click the button below.`,
            url,
            buttonLabel: 'View Ticket',
            fields: [
              { name: 'Replied By', value: replier?.username || 'Unknown', inline: true },
              { name: 'Date', value: new Date().toLocaleString(), inline: true }
            ],
            timestamp: new Date(),
            ticketId: ticket._id?.toString(),
            category: ticket.category,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            avatarUrl: replier?.avatar || undefined
          }).catch(() => {});
        }
      }
    }
  }
  // Notify all admins except the replier
  const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
  const notifications = admins
    .filter(admin => String(admin._id) !== user.id)
    .map(admin => ({
      user: admin._id,
      message: `A ticket received a new reply: ${ticket.title}`,
      type: 'ticket_reply',
      link: `/tickets/${ticket._id}`
    }));
  await Notification.insertMany(notifications);
  notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
  if (user) {
    await Log.create({
      user: user.id,
      action: 'reply_ticket',
      targetType: 'ticket',
      targetId: ticket._id,
      details: { ticketId: ticket._id, message },
    });
  }
  const ticketIdStr = (ticket as any)._id?.toString();
  io.to(ticketIdStr).emit('ticket-updated', ticket);
  return ticket;
};

export const updateTicketStatusService = async (id: string, status: string, user: any) => {
  const validStatuses = ['open', 'in_progress', 'resolved'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status.');
  }
  const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
  if (!ticket) throw new Error('Ticket not found.');
  if (String(ticket.user) !== user.id) {
    const notif = await Notification.create({
      user: ticket.user,
      message: `The status of your ticket changed to ${status}: ${ticket.title}`,
      type: 'ticket_status',
      link: `/tickets/${ticket._id}`
    });
    io.to(String(ticket.user)).emit('notification', notif);
    const ticketOwner = await (await import('../models/User')).default.findById(ticket.user);
    if (ticketOwner && ticketOwner.notificationPreferences) {
      const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tickets/${ticket._id}`;
      if (ticketOwner.notificationPreferences.email && ticketOwner.email) {
        sendMail({
          to: ticketOwner.email,
          subject: `Ticket status updated: ${status}`,
          text: `The status of your ticket "${ticket.title}" changed to ${status}.\n\nView: ${url}`
        }).catch(() => {});
      }
      if (ticketOwner.notificationPreferences.discord && ticketOwner.discordId) {
        const muted = ticketOwner?.notificationPreferences?.discordMuted;
        const muteUntil = ticketOwner?.notificationPreferences?.discordMuteUntil;
        const now = new Date();
        const isMuted = muted && (!muteUntil || new Date(muteUntil) > now);
        if (!isMuted) {
          sendDiscordMessage(ticketOwner.discordId, {
            type: 'status',
            description: `The status of your ticket **${ticket.title}** changed to **${status}**.`,
            url,
            buttonLabel: 'View Ticket',
            timestamp: new Date(),
            ticketId: ticket._id?.toString(),
            category: ticket.category,
            priority: ticket.priority,
            createdAt: ticket.createdAt
          }).catch(() => {});
          if (status === 'resolved') {
            sendDiscordMessage(ticketOwner.discordId, {
              type: 'status',
              title: 'How satisfied are you with the support?',
              description: 'Your ticket has been resolved. Please rate your experience and leave a comment if you wish.',
              url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tickets/${ticket._id}?survey=1`,
              buttonLabel: 'Rate Support',
              timestamp: new Date(),
              ticketId: ticket._id?.toString(),
              category: ticket.category,
              priority: ticket.priority,
              createdAt: ticket.createdAt
            }).catch(() => {});
          }
        }
      }
    }
  }
  const admins = await (await import('../models/User')).default.find({ role: { $in: ['admin', 'superadmin', 'moderator', 'staff'] } });
  const notifications = admins
    .filter(admin => String(admin._id) !== user.id)
    .map(admin => ({
      user: admin._id,
      message: `A ticket status was updated to ${status}: ${ticket.title}`,
      type: 'ticket_status',
      link: `/tickets/${ticket._id}`
    }));
  await Notification.insertMany(notifications);
  notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
  const updatedTicket = await Ticket.findById(id);
  const ticketIdStr = (updatedTicket as any)._id?.toString();
  io.to(ticketIdStr).emit('ticket-updated', updatedTicket);
  return ticket;
};

export const deleteTicketService = async (id: string, user: any) => {
  const ticket = await Ticket.findByIdAndDelete(id);
  if (!ticket) throw new Error('Ticket not found.');
  if (String(ticket.user) !== user.id) {
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
    .filter(admin => String(admin._id) !== user.id)
    .map(admin => ({
      user: admin._id,
      message: `A ticket was deleted: ${ticket.title}`,
      type: 'ticket_deleted',
      link: `/tickets/${ticket._id}`
    }));
  await Notification.insertMany(notifications);
  notifications.forEach(n => io.to(String(n.user)).emit('notification', n));
  if (user) {
    await Log.create({
      user: user.id,
      action: 'delete_ticket',
      targetType: 'ticket',
      targetId: id,
      details: { ticketId: id, title: ticket.title, user: ticket.user },
    });
  }
  if (ticket && ticket.user) {
    const ticketOwner = await (await import('../models/User')).default.findById(ticket.user);
    const muted = ticketOwner?.notificationPreferences?.discordMuted;
    const muteUntil = ticketOwner?.notificationPreferences?.discordMuteUntil;
    const now = new Date();
    const isMuted = muted && (!muteUntil || new Date(muteUntil) > now);
    if (ticketOwner && ticketOwner.notificationPreferences?.discord && ticketOwner.discordId && !isMuted) {
      sendDiscordMessage(ticketOwner.discordId, {
        type: 'deleted',
        description: `Your ticket **${ticket.title}** was deleted.`,
        timestamp: new Date(),
        ticketId: ticket._id?.toString(),
        category: ticket.category,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      }).catch(() => {});
    }
  }
  return { message: 'Ticket deleted.' };
}; 