const DB_NAME = process.env.DB_NAME
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_HOST = process.env.DB_HOST

const knex = require('knex')({
    client: 'pg',
    version: '13',
    connection: {
      host : DB_HOST,
      user : DB_USER,
      password : DB_PASSWORD,
      database : DB_NAME,
      ssl:{ rejectUnauthorized: false }
    }
  });
//QUANDO TIVER ERRO AO CONECTAR NO SSL DO HEROKU OFF:
//https://stackoverflow.com/questions/61097695/self-signed-certificate-error-during-query-the-heroku-hosted-postgres-database

  module.exports = knex

// heroku config:add TZ=America/Recife
// heroku run bash
// date

//heroku addons:attach postgresql-dimensional-92283 -a ecomerce-front
//heroku pg:promote HEROKU_POSTGRESQL_PURPLE