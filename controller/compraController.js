const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")
var uniqid = require('uniqid');
const Cliente = require('../Databases/client/Cliente');
const CodItens = require("../Databases/client/CodItens")
const Carrinho = require("../Databases/client/Carrinho")

// ENTÃO PARAMOS AQUI

router.get("/carrinho/finalizarCompra", auth, async (req, res) => {
    var usuario = req.session.cli
    if (usuario != undefined) {
        var cliente = await Cliente.findByPk(usuario.id)

        if (cliente.cpf != undefined && cliente.cpf != '') {
            try {
                var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id } })
                var codItens = await CodItens.findAll({ where: { carrinhoId: carrinho.id } })
                var descricao = []
                codItens.forEach(async codIten => {
                    var nomeProduto = await knex("produtos").select("nome").where({ id: codIten.produtoId })
                    descricao.push(nomeProduto[0].nome)
                    var desc = desc + `${codIten.quantidade}x${nomeProduto[0].nome}`
                })
                
                var idUnica = uniqid()


                var dados = {
                    items: [
                        item = {
                            id: idUnica,
                            title: descricao,
                            quantity: 1,
                            currency_id: 'BRL',
                            unit_price: parseFloat(total)
                        }
                    ],payer: {
                        email: cliente.email,
                        cpf: cliente.cpf

                }
            }
            } catch (err) {
            console.log(err)
            res.json({ erro: "Ocorreu um erro, entre em contato com o suporte" })
        }
    } else {
        res.json({ erro: "Necessario finalizar seu cadastro!" })
    }
} else {
    res.redirect("/login")
}
})


//         ],
// payer: {
//     email: cliente.email
// },
// external_reference: {
//     id: idUnica,

//         }
//     }


module.exports = router