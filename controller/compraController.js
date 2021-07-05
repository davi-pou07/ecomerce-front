const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")
var uniqid = require('uniqid');
const Cliente = require('../Databases/client/Cliente');
const CodItens = require("../Databases/client/CodItens")
const Carrinho = require("../Databases/client/Carrinho");
const MercadoPago = require("mercadopago");


const { compareSync } = require('bcryptjs');

MercadoPago.configure({
    sandbox: true,
    access_token: "TEST-1254504299447071-061611-ac2150294a43f6a4d65d10f6f66512f8-257758072"
})
// ENTÃO PARAMOS AQUI

router.get("/carrinho/finalizarCompra", async (req, res) => {
    // var usuario = req.session.cli
    var usuario = {id:1}
    if (usuario != undefined) {
        var cliente = await Cliente.findByPk(usuario.id)
        try {
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id } })
            var codItens = await CodItens.findAll({ where: { carrinhoId: carrinho.id }, raw: true })
            var descricao = ''
            for (x = 0; x < codItens.length; x++) {
                var nomeProduto = await knex("produtos").select("nome").where({ id: codItens[x].produtoId })
                var descricao = descricao + `${codItens[x].quantidade}x${nomeProduto[0].nome.split(" ")[0]}`
            }
            var idUnica = uniqid()
        } catch (err) {
            console.log(err)
            res.json({ erro: "Ocorreu um erro, entre em contato com o suporte" })
        }
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
                userId: cliente.id,
                carrinhoId: carrinho.id
            },
            external_reference: idUnica,
            "back_urls": {
                failure: 'https://ecomerce-front.herokuapp.com/failure',
                pending: 'https://ecomerce-front.herokuapp.com/pending',
                success: 'https://ecomerce-front.herokuapp.com/success'
            },
            "auto_return": "approved"
        }

        try {
            var pag = await MercadoPago.preferences.create(dados)
            var pagamento = pag.response
            console.log(pagamento)
            try {
                var dadosVendas = await knex('dadosvendas').select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })
            } catch (err) {
                console.log("Não foi possivel acessar")
            }
            console.log(dadosVendas)
            if (dadosVendas == '' || dadosVendas == undefined) {
                try {
                    knex('dadosvendas').insert({
                        dadosId: pagamento.external_reference,
                        descricao: descricao,
                        quantidade: 1,
                        currency_id: 'BRL',
                        unit_price: parseFloat(carrinho.precoTotal),
                        emailCliente: cliente.email,
                        clienteId: cliente.id,
                        carrinhoId: carrinho.id,
                        status: 'P',
                        tentativas: 1,
                        createdAt: pagamento.date_created,
                        updatedAt: pagamento.date_created
                    }).then(() => {
                        return res.redirect(pag.body.init_point)
                    }).catch(err => {
                        console.log(err)
                    })
                } catch (err) {
                    console.log(err)
                }
            } else {
                console.log(pagamento.external_reference) 
                knex('dadosvendas').update({
                    dadosId: pagamento.external_reference,
                    tentativas: parseInt(dadosVendas[0].tentativas) + 1,
                    descricao: descricao,
                    emailCliente: cliente.email,
                    unit_price: parseFloat(carrinho.precoTotal)
                }).where({id:dadosVendas[0].id}).then(() => {
                    return res.redirect(pag.body.init_point)
                })
            }
        }
        catch (err) {
            return res.send(err.message)
        }
    } else {
        res.redirect("/login")
    }
})


router.post("/statusPagamento", async(req, res)=> {
    var id = req.query.id
    setTimeout(() => {
        var filtro = {
            "order.id": id
        }
        MercadoPago.payment.search({
            qs: filtro
        }).then(async data => {

            var results = data.body.results[0]
            console.log(results)
            console.log("---------------------------")
            console.log(results.transaction_details)
            var external_reference = results.external_reference
            try {
                var dadosVendas = await knex("dadosvendas").select("clienteId", "carrinhoId").where({ dadosId: external_reference })
                
                knex('dadospagamentos').insert({
                    dadosId: results.external_reference,
                    dataAutorizacao: results.date_approved,
                    totalPago: results.transaction_details.total_paid_amount,
                    valorBrutoRecebido: results.transaction_details.installment_amount,
                    external_reference: results.external_reference,
                    tipoDePagamento: results.payment_type_id,
                    ordeId: id,
                    detalhePagamento: results.status_detail,
                    dataExpiracao: results.date_of_expiration,
                    dataLancamento: results.date_created,
                    codigoDeBarras: results.barcode.content,
                    clienteId: dadosVendas[0].clienteId,
                    carrinhoId: dadosVendas[0].carrinhoId,
                    status: results.status_detail,
                    descricao: results.description,
                    metodoPagamento: results.payment_method_id
                }).then(() => {
                    res.send("ok")
                })
            } catch (err) {
                res.json("Impossivel de executar a venda")
                console.log(err)
            }
        }).catch(err => {
            console.log(err)
        })
    }, 20000)
})

module.exports = router