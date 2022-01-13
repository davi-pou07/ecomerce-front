const express = require('express')
const router = express()
const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../Databases/client/databasesCL")
const queryInterface = sequelize.getQueryInterface();


router.get("/atualizarCoditem",(req,res)=>{
    queryInterface.addColumn(
        'coditens',
        'acrescimo',
        {
            type:Sequelize.FLOAT,
            allowNull:true
        }
      ).then(()=>{
          console.log('ok')
      })
      queryInterface.addColumn(
        'coditens',
        'desconto',
        {
            type:Sequelize.FLOAT,
            allowNull:true
        }
      ).then(()=>{
          console.log('ok')
      })
    res.send("FEITO")
})

module.exports = router