import { Router } from 'express';
import { createTicket, getTickets, replyTicket } from '../controllers/ticketController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, createTicket);
router.get('/', authMiddleware, getTickets);
router.post('/:id/reply', authMiddleware, replyTicket);

export default router; 