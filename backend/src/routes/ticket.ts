import { Router } from 'express';
import { createTicket, getTickets, replyTicket, getTicketById, submitSatisfactionSurvey } from '../controllers/ticketController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authMiddleware, createTicket);
router.get('/', authMiddleware, getTickets);
router.post('/:id/reply', authMiddleware, replyTicket);
router.get('/:id', authMiddleware, getTicketById);
router.post('/:id/survey', authMiddleware, submitSatisfactionSurvey);

export default router; 