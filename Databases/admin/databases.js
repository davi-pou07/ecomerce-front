
const knex = require('knex')({
    client: 'pg',
    version: '12',
    connection: {
      host : 'localhost',
      user : 'postgres',
      password : 'davi6259',
      database : 'ecomerce'
    }
  });

  module.exports = knex