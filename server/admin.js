const express = require('express');
const router = express.Router();
const knex = require('knex')(require('./knexfile').development);
const { authorizeRoles } = require('./auth');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');

// List users
router.get('/users', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const users = await knex('users').select('id', 'email', 'display_name', 'role_id', 'steam_id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List roles
router.get('/roles', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const roles = await knex('roles').select('*');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign role to user
router.post('/users/:id/role', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { role_id } = req.body;
    await knex('users').where({ id: req.params.id }).update({ role_id });
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user (admin)
router.post('/users', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { email, password, display_name, role_id } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await knex('users').insert({ email, password: passwordHash, display_name, role_id }).returning(['id', 'email', 'display_name', 'role_id']);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:id', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    await knex('users').where({ id: req.params.id }).del();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/automation', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const rules = await knex('automation_rules').select('*');
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/automation', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, conditions, actions, enabled } = req.body;
    const [rule] = await knex('automation_rules').insert({ name, conditions: JSON.stringify(conditions), actions: JSON.stringify(actions), enabled }).returning('*');
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/automation/:id', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, conditions, actions, enabled } = req.body;
    const [rule] = await knex('automation_rules').where({ id: req.params.id }).update({ name, conditions: JSON.stringify(conditions), actions: JSON.stringify(actions), enabled }).returning('*');
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/automation/:id', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    await knex('automation_rules').where({ id: req.params.id }).del();
    res.json({ message: 'Automation rule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/custom-fields', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const fields = await knex('custom_fields').select('*');
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/custom-fields', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, type, options, required } = req.body;
    const [field] = await knex('custom_fields').insert({ name, type, options: JSON.stringify(options), required }).returning('*');
    res.status(201).json(field);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/custom-fields/:id', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, type, options, required } = req.body;
    const [field] = await knex('custom_fields').where({ id: req.params.id }).update({ name, type, options: JSON.stringify(options), required }).returning('*');
    res.json(field);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/custom-fields/:id', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    await knex('custom_fields').where({ id: req.params.id }).del();
    res.json({ message: 'Custom field deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export tickets as CSV
router.get('/export/tickets', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const tickets = await knex('tickets').select('*');
    const parser = new Parser();
    const csv = parser.parse(tickets);
    res.header('Content-Type', 'text/csv');
    res.attachment('tickets.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/canned-responses', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const responses = await knex('canned_responses').select('*');
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/canned-responses', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const [response] = await knex('canned_responses').insert({ title, content, category }).returning('*');
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/canned-responses/:id', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const [response] = await knex('canned_responses').where({ id: req.params.id }).update({ title, content, category }).returning('*');
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/canned-responses/:id', authorizeRoles('admin', 'superadmin'), async (req, res) => {
  try {
    await knex('canned_responses').where({ id: req.params.id }).del();
    res.json({ message: 'Canned response deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 