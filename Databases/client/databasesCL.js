const Sequelize = require("sequelize");

const connectionCL = new Sequelize(process.env.CLIENT_DATABASE_DB, process.env.CLIENT_USERNAME_DB, process.env.CLIENT_PASSWORD_DB, {
  host: process.env.CLIENT_HOST_DB,
  dialect: 'postgres',
  port: process.env.CLIENT_PORT_DB,
  timezone: "-03:00",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
})
module.exports = connectionCL;