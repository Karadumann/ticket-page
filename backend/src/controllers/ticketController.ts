import { Request as ExpressRequest, Response } from 'express';
import Ticket from '../models/Ticket';

interface AuthRequest extends ExpressRequest {
  user?: any;
}

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const ticket = new Ticket({
      title,
      description,
      user: req.user.id,
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

export const replyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket bulunamadı.' });
    ticket.replies.push({ message, user: req.user.id, createdAt: new Date() });
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
}; 