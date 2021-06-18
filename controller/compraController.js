const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")
var uniqid = require('uniqid');
const Cliente = require('../Databases/client/Cliente');


router.get("/pagamento", (req, res) => {

    // var produtos = await produtosVendas.findOne()
    // var venda = await venda.findOnde()
    // var total = venda.total
    // var des = []
    //produtos.forEach(produto =>{
    //     if(produto != undefined){
    //         descricao.push(produto.quantidade +"x"+ produto.nome+";")
    //     }
    // })
    // descricao = des.toString()
    var idUnica = uniqid()
    var dados = {
        items: [
            item = {
                id: idUnica,
                title:descricao,
                quantity:1,
                currency_id:'BRL',
                unit_price: parseFloat(total)
            }
        ],
        payer:{
            email:cliente.email
        },
        external_reference:{
            id: idUnica,

        }
    }

})

module.exports = router