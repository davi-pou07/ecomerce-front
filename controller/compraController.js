const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")
var uniqid = require('uniqid');
const Cliente = require('../Databases/client/Cliente');
const CodItens = require("../Databases/client/CodItens")
const Carrinho = require("../Databases/client/Carrinho");
const MercadoPago = require("mercadopago");

MercadoPago.configure({
    sandbox: true,
    access_token: "TEST-1254504299447071-061611-ac2150294a43f6a4d65d10f6f66512f8-257758072"
})
// ENTÃO PARAMOS AQUI

router.get("/carrinho/finalizarCompra", auth, async (req, res) => {
    var usuario = req.session.cli

    if (usuario != undefined) {
        var cliente = await Cliente.findByPk(usuario.id)

        try {
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id } })
            var codItens = await CodItens.findAll({ where: { carrinhoId: carrinho.id } })
            var descricao = ''
            for (var x = 0; x < codItens.length; x++) {
                var nomeProduto = await knex("produtos").select("nome").where({ id: codItens[0].produtoId })
                var descricao = descricao + `${codItens[x].quantidade}x${nomeProduto[0].nome.split(" ")[0]}`
            }
            var idUnica = uniqid()

            var dados = {
                items: [
                    item = {
                        id: idUnica,
                        title: descricao,
                        quantity: 1,
                        currency_id: 'BRL',
                        unit_price: parseFloat(carrinho.precoTotal)
                    }
                ],
                payer: {
                    email: cliente.email,
                    codUser: cliente.id
                },
                external_reference: idUnica
            }
            console.log(dados)

            try {
                var pagamento = await MercadoPago.preferences.create(dados)
                console.log(pagamento)
                return res.redirect(pagamento.body.init_point)
            }
            catch (err) {
                return res.send(err.message)
            }

        } catch (err) {
            console.log(err)
            res.json({ erro: "Ocorreu um erro, entre em contato com o suporte" })
        }
    } else {
        res.redirect("/login")
    }
})

router.post("/statusPagamento",(req,res)=>{
    console.log(req.query)
    res.send("ok")
})

module.exports = router