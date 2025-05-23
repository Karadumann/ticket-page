import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/db';
import authRoutes from './routes/auth';
import ticketRoutes from './routes/ticket';
import adminRoutes from './routes/admin';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { addOnlineAdmin, removeOnlineAdmin } from './utils/onlineAdmins';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, { cors: { origin: '*' } });

const viewingTickets: { [ticketId: string]: { userId: string, username: string, role: string }[] } = {};
const typingReplies: { [ticketId: string]: { userId: string, username: string, role: string }[] } = {};
const adminChatMessages: { userId: string, username: string, role: string, message: string, timestamp: number }[] = [];

io.on('connection', (socket) => {
  console.log('A user connected via Socket.IO');

  socket.on('register-user', ({ userId }) => {
    if (userId) {
      socket.join(userId);
    }
  });

  socket.on('viewing-ticket', ({ ticketId, userId, username, role }) => {
    if (!ticketId || !userId) return;
    if (!viewingTickets[ticketId]) viewingTickets[ticketId] = [];
    // Aynı user tekrar eklenmesin
    if (!viewingTickets[ticketId].some(u => u.userId === userId)) {
      viewingTickets[ticketId].push({ userId, username, role });
    }
    io.emit('viewing-ticket-update', { ticketId, viewers: viewingTickets[ticketId] });
    socket.join(`ticket-${ticketId}`);
    socket.data.ticketId = ticketId;
    socket.data.userId = userId;
  });

  socket.on('stop-viewing-ticket', ({ ticketId, userId }) => {
    if (!ticketId || !userId) return;
    if (viewingTickets[ticketId]) {
      viewingTickets[ticketId] = viewingTickets[ticketId].filter(u => u.userId !== userId);
      io.emit('viewing-ticket-update', { ticketId, viewers: viewingTickets[ticketId] });
    }
    socket.leave(`ticket-${ticketId}`);
  });

  socket.on('typing-reply', ({ ticketId, userId, username, role }) => {
    if (!ticketId || !userId) return;
    if (!typingReplies[ticketId]) typingReplies[ticketId] = [];
    if (!typingReplies[ticketId].some(u => u.userId === userId)) {
      typingReplies[ticketId].push({ userId, username, role });
      io.emit('typing-reply-update', { ticketId, typers: typingReplies[ticketId] });
    }
  });

  socket.on('stop-typing-reply', ({ ticketId, userId }) => {
    if (!ticketId || !userId) return;
    if (typingReplies[ticketId]) {
      typingReplies[ticketId] = typingReplies[ticketId].filter(u => u.userId !== userId);
      io.emit('typing-reply-update', { ticketId, typers: typingReplies[ticketId] });
    }
  });

  // Admin chat join
  socket.on('join-admin-chat', ({ userId, username, role }) => {
    if (!userId || !["admin", "superadmin", "staff", "moderator"].includes(role)) return;
    socket.join('admin-chat');
    socket.data.adminChatUser = { userId, username, role };
    // Son 30 mesajı gönder
    socket.emit('admin-chat-history', adminChatMessages.slice(-30));
  });

  // Admin chat mesajı
  socket.on('admin-chat-message', ({ message }) => {
    const user = socket.data.adminChatUser;
    console.log('admin-chat-message user:', user); // debug
    if (!user || !message || typeof message !== 'string' || !message.trim()) return;
    const msgObj = {
      userId: user.userId,
      username: user.username,
      role: user.role,
      message: message.trim(),
      timestamp: Date.now()
    };
    console.log('admin-chat-message msgObj:', msgObj); // debug
    if (!msgObj.userId || !msgObj.username || !msgObj.role) {
      console.warn('Eksik mesaj bilgisi:', msgObj);
    }
    adminChatMessages.push(msgObj);
    io.to('admin-chat').emit('admin-chat-message', msgObj);
  });

  const token = socket.handshake.query.token as string;
  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      if (["admin", "superadmin", "staff", "moderator"].includes(decoded.role)) {
        addOnlineAdmin(decoded.id || decoded._id);
        socket.data.adminId = decoded.id || decoded._id;
      }
    } catch (e) {}
  }

  socket.on('disconnect', () => {
    const { ticketId, userId } = socket.data || {};
    if (ticketId && userId && viewingTickets[ticketId]) {
      viewingTickets[ticketId] = viewingTickets[ticketId].filter(u => u.userId !== userId);
      io.emit('viewing-ticket-update', { ticketId, viewers: viewingTickets[ticketId] });
    }
    if (ticketId && userId && typingReplies[ticketId]) {
      typingReplies[ticketId] = typingReplies[ticketId].filter(u => u.userId !== userId);
      io.emit('typing-reply-update', { ticketId, typers: typingReplies[ticketId] });
    }
    if (socket.data && socket.data.adminId) {
      removeOnlineAdmin(socket.data.adminId);
    }
  });
});

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 1 IP in 1 minute can make 100 requests
  message: { message: 'Too many requests. Please try again later.' }
});

app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}); 