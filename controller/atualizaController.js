const express = require('express')
const router = express()
const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require("../Databases/client/databasesCL")
const queryInterface = sequelize.getQueryInterface();
const CodItens =  require("../Databases/client/CodItens")

// router.get("/atualizarCoditem",(req,res)=>{
//     queryInterface.addColumn(
//         'coditens',
//         'acrescimo',
//         {
//             type:Sequelize.FLOAT,
//             allowNull:true
//         }
//       ).then(()=>{
//           console.log('ok')
//       })
//       queryInterface.addColumn(
//         'coditens',
//         'desconto',
//         {
//             type:Sequelize.FLOAT,
//             allowNull:true
//         }
//       ).then(()=>{
//           console.log('ok')
//       })
//     res.send("FEITO")
// })
router.get("/atualizarCoditem",(req,res)=>{
    CodItens.findAll().then(coditens =>{
        coditens.forEach(cod => {
            if (cod.acredimo == undefined || cod.acredimo == '') {
                cod.acredimo = 0
            }
            if (cod.desconto == undefined || cod.desconto == '') {
                cod.desconto = 0
            }
        });
    })
})

module.exports = router