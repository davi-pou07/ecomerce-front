const knex = require('knex')({
  client: 'pg',
  version: '13',
  connection: {
    host: process.env.ADMIN_HOST_DB,
    user: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASSWORD,
    database: process.env.ADMIN_DATABASE,
    ssl: { rejectUnauthorized: false }
  }
});

module.exports = knex