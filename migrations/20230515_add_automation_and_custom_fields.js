exports.up = function(knex) {
  return knex.schema
    .createTable('automation_rules', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('conditions'); // JSON string
      table.text('actions');    // JSON string
      table.boolean('enabled').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('custom_fields', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('type').notNullable(); // text, select, checkbox, etc.
      table.text('options'); // JSON string for select options
      table.boolean('required').defaultTo(false);
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('custom_fields')
    .dropTableIfExists('automation_rules');
}; 