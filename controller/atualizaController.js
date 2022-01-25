const express = require('express')
const router = express()
const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../Databases/client/databasesCL")
const queryInterface = sequelize.getQueryInterface();
const CodItens =  require("../Databases/client/CodItens")

router.get("/atualizarCoditem",(req,res)=>{
    // queryInterface.addColumn(
    //     'coditens',
    //     'acrescimo',
    //     {
    //         type:Sequelize.FLOAT,
    //         allowNull:true
    //     }
    //   ).then(()=>{
    //       console.log('ok')
    //   })
    //   queryInterface.addColumn(
    //     'coditens',
    //     'desconto',
    //     {
    //         type:Sequelize.FLOAT,
    //         allowNull:true
    //     }
    //   ).then(()=>{
    //       console.log('ok')
    //   })

    //   CodItens.findAll().then(coditens =>{
    //     coditens.forEach(cod => {
    //         if (cod.acredimo == null) {
    //             CodItens.update({acrescimo:0},{where:{id:cod.id}})
    //         }
    //         if (cod.desconto == null) {
    //             CodItens.update({desconto:0},{where:{id:cod.id}})
    //         }
    //     });
    // })
    // res.send("ok")
})
    

module.exports = router