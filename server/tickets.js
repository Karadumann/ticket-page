const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('./auth');

const knex = require('knex')(require('./knexfile').development);

router.use(authenticateJWT);

// Create ticket
router.post('/', async (req, res) => {
  try {
    const { user_id, category, priority, tags, custom_fields } = req.body;
    const [ticket] = await knex('tickets')
      .insert({ user_id, category, priority, tags, custom_fields, status: 'open' })
      .returning('*');
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await knex('tickets').select('*');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ticket by id
router.get('/:id', async (req, res) => {
  try {
    const ticket = await knex('tickets').where({ id: req.params.id }).first();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add message to ticket
router.post('/:id/messages', async (req, res) => {
  try {
    const { user_id, content, attachments } = req.body;
    const ticket = await knex('tickets').where({ id: req.params.id }).first();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const [message] = await knex('messages')
      .insert({ ticket_id: ticket.id, user_id, content, attachments })
      .returning('*');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List messages for a ticket
router.get('/:id/messages', async (req, res) => {
  try {
    const ticketMessages = await knex('messages').where({ ticket_id: req.params.id });
    res.json(ticketMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 