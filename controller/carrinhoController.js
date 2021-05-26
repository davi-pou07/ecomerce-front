const router = express.Router()
const express = require('express')
const knex = require("../Databases/admin/databases")
const Carrinho = require("../Databases/client/Carrinho")

router.get("/carrinho/:idCli",(req,res)=>{
    var idCli = req.params.idCli
    if (idCli != undefined) {
        if (!isNaN(idCli)) {
            Carrinho.findOne({where:{clienteId:idCli}}).then(carrinho =>{
                res.json(carrinho)
            })
        } else {
            res.json({err:"ID INCORRETO"})
        }
    } else {
        
    }
})

module.exports = router