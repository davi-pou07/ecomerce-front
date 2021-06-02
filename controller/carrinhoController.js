const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const Carrinho = require("../Databases/client/Carrinho")
const CodItens = require("../Databases/client/CodItens")

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

router.post("/carrinho/adicionar",(req,res)=>{ 
    //if sessao
    //cadastro/login
    var codItem = req.body.codItem
    var quantidadeItem = req.body.quantidadeItem
    var refcoluna = req.body.refcoluna
    var reflinha = req.body.reflinha
    CodItens.create({
        produtoId: codItem,
        quantidade:quantidadeItem,
        refcoluna:refcoluna,
        reflinha:reflinha,
        carrinhoId: 1
    }).then(codItems =>{
        Carrinho.findByPk(codItems.carrinhoId).then(carrinho =>{
           var qtd = parseInt(carrinho.quantidade) + parseInt(quantidadeItem)
            Carrinho.update({
                quantidade:qtd
            },{where:{id:carrinho.id}})
        })
        
    })
})

module.exports = router