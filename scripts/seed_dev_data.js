const knex = require('knex')(require('../server/knexfile').development);
const bcrypt = require('bcryptjs');

async function seed() {
  // Clear tables
  await knex('messages').del();
  await knex('tickets').del();
  await knex('users').del();
  await knex('roles').del();

  // Roles
  const [userRoleId] = await knex('roles').insert({ name: 'user', description: 'Normal user' }).returning('id');
  const [supportRoleId] = await knex('roles').insert({ name: 'support', description: 'Support agent' }).returning('id');
  const [adminRoleId] = await knex('roles').insert({ name: 'admin', description: 'Admin' }).returning('id');
  const [superAdminRoleId] = await knex('roles').insert({ name: 'superadmin', description: 'Super Admin' }).returning('id');

  // Users
  const users = [
    {
      email: 'user1@example.com',
      password: await bcrypt.hash('userpass', 10),
      display_name: 'User One',
      role_id: userRoleId,
    },
    {
      email: 'support1@example.com',
      password: await bcrypt.hash('supportpass', 10),
      display_name: 'Support One',
      role_id: supportRoleId,
    },
    {
      email: 'admin1@example.com',
      password: await bcrypt.hash('adminpass', 10),
      display_name: 'Admin One',
      role_id: adminRoleId,
    },
    {
      steam_id: 'STEAM_0:1:12345678',
      display_name: 'Steam User',
      role_id: userRoleId,
    },
  ];
  const userIds = await knex('users').insert(users).returning('id');

  // Tickets
  const tickets = [
    {
      user_id: userIds[0],
      category: 'Technical',
      status: 'open',
      priority: 'high',
      tags: 'bug,urgent',
      custom_fields: JSON.stringify({ server: 'EU1' }),
    },
    {
      user_id: userIds[1],
      category: 'Account',
      status: 'closed',
      priority: 'low',
      tags: 'account',
      custom_fields: JSON.stringify({ server: 'NA2' }),
    },
  ];
  const ticketIds = await knex('tickets').insert(tickets).returning('id');

  // Canned responses (quick replies)
  await knex('custom_fields').del();
  await knex('custom_fields').insert([
    { name: 'Server', type: 'text', options: null, required: false },
    { name: 'Character Name', type: 'text', options: null, required: false },
  ]);

  console.log('Seed data inserted!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); }); 