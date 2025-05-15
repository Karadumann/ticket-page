require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'steam_admin',
      password: process.env.DB_PASSWORD || 'steam_pass',
      database: process.env.DB_NAME || 'steam_ticket',
    },
    migrations: {
      directory: '../migrations',
    },
    seeds: {
      directory: '../scripts',
    },
  },
}; 