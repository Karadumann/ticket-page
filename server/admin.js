const express = require('express');
const router = express.Router();
const knex = require('knex')(require('./knexfile').development);
const { authorizeRoles } = require('./auth');
const bcrypt = require('bcryptjs');

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

module.exports = router; 