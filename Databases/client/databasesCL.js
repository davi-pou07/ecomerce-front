const Sequelize = require("sequelize");

// const connectionCL = new Sequelize('postgres://naeoolvlzfexcm:0097bce388efc76f8d1603d8cd930982f031093997366dc856a3a6aff4b625cc@ec2-35-169-188-58.compute-1.amazonaws.com:5432/d6orq1epqv96kp')
const connectionCL = new Sequelize('d6orq1epqv96kp', 'naeoolvlzfexcm', '0097bce388efc76f8d1603d8cd930982f031093997366dc856a3a6aff4b625cc', {
    host: 'ec2-35-169-188-58.compute-1.amazonaws.com',
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
//postgres://naeoolvlzfexcm:0097bce388efc76f8d1603d8cd930982f031093997366dc856a3a6aff4b625cc@ec2-35-169-188-58.compute-1.amazonaws.com:5432/d6orq1epqv96kp
//postgres://naeoolvlzfexcm:0097bce388efc76f8d1603d8cd930982f031093997366dc856a3a6aff4b625cc@ec2-35-169-188-58.compute-1.amazonaws.com:5432/d6orq1epqv96kp
//https://help.heroku.com/DR0TTWWD/seeing-fatal-no-pg_hba-conf-entry-errors-in-postgres
//https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
//https://devcenter.heroku.com/articles/heroku-postgresql#heroku-postgres-ssl

//https://medium.com/@ochieng.grace/sequelize-your-way-to-heroku-with-express-2c31be3752e0


//heroku config:set PGSSLMODE=no-verify
//heroku pg:reset DATABASE --confirm produtosenderecamento
//set DATABASE_URL=postgres://$(whoami)

//heroku git:remote -a thawing-inlet-61413

