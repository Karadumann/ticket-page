exports.up = function(knex) {
  return knex.schema
    .createTable('roles', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
    })
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('steam_id').unique();
      table.string('email').unique();
      table.string('password');
      table.string('display_name');
      table.integer('role_id').unsigned().references('id').inTable('roles');
      table.timestamps(true, true);
    })
    .createTable('tickets', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users');
      table.string('category');
      table.string('status').defaultTo('open');
      table.string('priority');
      table.string('tags');
      table.text('custom_fields');
      table.timestamps(true, true);
    })
    .createTable('messages', function(table) {
      table.increments('id').primary();
      table.integer('ticket_id').unsigned().references('id').inTable('tickets');
      table.integer('user_id').unsigned().references('id').inTable('users');
      table.text('content');
      table.string('attachments');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('messages')
    .dropTableIfExists('tickets')
    .dropTableIfExists('users')
    .dropTableIfExists('roles');
}; 