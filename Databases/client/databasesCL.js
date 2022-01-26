const Sequelize = require("sequelize");

const DB_NAMECL = process.env.DB_NAMECL
const DB_USERCL = process.env.DB_USERCL
const DB_PASSWORDCL = process.env.DB_PASSWORDCL
const DB_HOSTCL = process.env.DB_HOSTCL

const connectionCL = new Sequelize(DB_NAMECL, DB_USERCL, DB_PASSWORDCL, {
    host: DB_HOSTCL,
    dialect: 'postgres',
    port: 5432,
    timezone: "-03:00",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // <<<<<<< YOU NEED THIS
        }
    }
})
module.exports = connectionCL;
//https://help.heroku.com/DR0TTWWD/seeing-fatal-no-pg_hba-conf-entry-errors-in-postgres
//https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
//https://devcenter.heroku.com/articles/heroku-postgresql#heroku-postgres-ssl

//https://medium.com/@ochieng.grace/sequelize-your-way-to-heroku-with-express-2c31be3752e0


//heroku config:set PGSSLMODE=no-verify
//heroku pg:reset DATABASE --confirm produtosenderecamento
//set DATABASE_URL=postgres://$(whoami)

//heroku git:remote -a thawing-inlet-61413

