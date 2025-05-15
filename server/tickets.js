const express = require('express');
const router = express.Router();

// Dummy in-memory storage
let tickets = [];
let messages = [];
let ticketId = 1;
let messageId = 1;

// Create ticket
router.post('/', (req, res) => {
  const { user_id, category, priority, tags, custom_fields } = req.body;
  const ticket = {
    id: ticketId++,
    user_id,
    category,
    status: 'open',
    priority,
    tags,
    custom_fields,
    created_at: new Date(),
    updated_at: new Date(),
  };
  tickets.push(ticket);
  res.status(201).json(ticket);
});

// List tickets
router.get('/', (req, res) => {
  res.json(tickets);
});

// Get ticket by id
router.get('/:id', (req, res) => {
  const ticket = tickets.find(t => t.id == req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json(ticket);
});

// Add message to ticket
router.post('/:id/messages', (req, res) => {
  const { user_id, content, attachments } = req.body;
  const ticket = tickets.find(t => t.id == req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  const message = {
    id: messageId++,
    ticket_id: ticket.id,
    user_id,
    content,
    attachments,
    created_at: new Date(),
  };
  messages.push(message);
  res.status(201).json(message);
});

// List messages for a ticket
router.get('/:id/messages', (req, res) => {
  const ticketMessages = messages.filter(m => m.ticket_id == req.params.id);
  res.json(ticketMessages);
});

module.exports = router; 