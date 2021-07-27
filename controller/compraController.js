const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")
var moment = require('moment');
var uniqid = require('uniqid');
const Cliente = require('../Databases/client/Cliente');
const CodItens = require("../Databases/client/CodItens")
const Carrinho = require("../Databases/client/Carrinho");
const nodemailer = require("nodemailer");
const MercadoPago = require("mercadopago");


const { compareSync } = require('bcryptjs');

MercadoPago.configure({
    sandbox: true,
    access_token: "TEST-1254504299447071-061611-ac2150294a43f6a4d65d10f6f66512f8-257758072"
})

var remetente = nodemailer.createTransport({
    host: "smtp.office365.com",
    service: "Outlook365",
    port: 587,
    secure: true,
    auth: {
        user: "poudeyvis007@gmail.com",
        pass: "95599441sergi"
    }
});


router.get("/carrinho/finalizarCompra", async (req, res) => {
    // var usuario = req.session.cli
    var usuario = { id: 1 }
    if (usuario != undefined) {
        var cliente = await Cliente.findByPk(usuario.id)
        try {
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })
            var codItens = await CodItens.findAll({ where: { carrinhoId: carrinho.id }, raw: true })
            var dadoEntrega = await knex('dadosentregas').select().where({clienteId:cliente.id,carrinhoId:carrinho.id})

            var descricao = ''
            for (x = 0; x < codItens.length; x++) {
                var nomeProduto = await knex("produtos").select("nome").where({ id: codItens[x].produtoId })
                var descricao = descricao + `${codItens[x].quantidade}x${nomeProduto[0].nome.split(" ")[0]}`
            }
            var dadosVendas = await knex('dadosvendas').select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })
            if (dadosVendas[0] == '' || dadosVendas[0] == undefined) {
                var idUnica = uniqid()
            } else {
                var idUnica = dadosVendas[0].dadosId
            }
            var precoTotal = parseFloat(carrinho.precoTotal) + parseFloat(dadoEntrega[0].valor)
            console.log("Preco total = "+ precoTotal)

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
                    unit_price: parseFloat(precoTotal)
                }
            ],
            payer: {
                email: cliente.email,
                userId: cliente.id,
                carrinhoId: carrinho.id
            },
            external_reference: idUnica,
            "back_urls": {
                failure: 'https://ecomerce-front.herokuapp.com/failure/',
                pending: 'https://ecomerce-front.herokuapp.com/pending/',
                success: 'https://ecomerce-front.herokuapp.com/success/'
            },
            "auto_return": "approved"
        }

        try {
            var pag = await MercadoPago.preferences.create(dados)
            var pagamento = pag.response
            if (dadosVendas[0] == '' || dadosVendas[0] == undefined) {
                try {
                    knex('dadosvendas').insert({
                        dadosId: pagamento.external_reference,
                        descricao: descricao,
                        quantidade: 1,
                        currency_id: 'BRL',
                        unit_price: precoTotal,
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
                knex('dadosvendas').update({
                    tentativas: parseInt(dadosVendas[0].tentativas) + 1,
                    descricao: descricao,
                    emailCliente: cliente.email,
                    unit_price: precoTotal
                }).where({ id: dadosVendas[0].id }).then(() => {
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

router.get("/success/", async (req, res) => {
    var param = req.query
    try {
        var dadosVendas = await knex("dadosvendas").select().where({ dadosId: param.external_reference })
        var date = moment().format();
        knex("dadostransicoes").insert({
            dadosId: param.external_reference,
            status: param.status,
            clienteId: dadosVendas[0].clienteId,
            carrinhoId: dadosVendas[0].carrinhoId,
            collection_status: param.collection_status,
            formaPagamento: param.payment_type,
            orderId: param.merchant_order_id,
            createdAt: date,
            updatedAt: date
        }).then(() => {
            knex("dadosentregas").update({status: 'Entrega em andamento' }).where({clienteId: dadosVendas[0].clienteId,carrinhoId: dadosVendas[0].carrinhoId})
            knex("dadosvendas").update({ status: 'A' }).where({ dadosId: dadosVendas[0].dadosId })
            Carrinho.update({ status: false }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })
                res.redirect("/usuario/historico/" + dadosTransicoes[0].id)
            })
        })
    } catch (err) {
        console.log(err)
        res.send("Ocorreu um erro ao processar dados")
    }
})

router.get("/pending/", async (req, res) => {
    var param = req.query
    try {
        var dadosVendas = await knex("dadosvendas").select().where({ dadosId: param.external_reference })
        var date = moment().format();
        knex("dadostransicoes").insert({
            dadosId: param.external_reference,
            status: param.status,
            clienteId: dadosVendas[0].clienteId,
            carrinhoId: dadosVendas[0].carrinhoId,
            collection_status: param.collection_status,
            formaPagamento: param.payment_type,
            orderId: param.merchant_order_id,
            createdAt: date,
            updatedAt: date
        }).then(() => {
            knex("dadosvendas").update({ status: 'P' }).where({ dadosId: dadosVendas[0].dadosId })
            Carrinho.update({ status: false }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })
                res.redirect("/usuario/historico/" + dadosTransicoes[0].id)
            })
        })
    } catch (err) {
        console.log(err)
        res.send("Ocorreu um erro ao processar dados")
    }
})

router.get("/failure/", async (req, res) => {
    var param = req.query
    try {
        var dadosVendas = await knex("dadosvendas").select().where({ dadosId: param.external_reference })
        var date = moment().format();
        knex("dadostransicoes").insert({
            dadosId: param.external_reference,
            status: param.status,
            clienteId: dadosVendas[0].clienteId,
            carrinhoId: dadosVendas[0].carrinhoId,
            collection_status: param.collection_status,
            formaPagamento: param.payment_type,
            orderId: param.merchant_order_id,
            createdAt: date,
            updatedAt: date
        }).then(async() => {
            knex("dadosvendas").update({ status: 'F' }).where({ dadosId: dadosVendas[0].dadosId })
            var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })
            res.redirect("/usuario/historico/" + dadosTransicoes[0].id)
        })
    } catch (err) {
        console.log(err)
        res.send("Ocorreu um erro ao processar dados")
    }
})

router.post("/statusPagamento", async (req, res) => {
    var id = req.query.id
    setTimeout(() => {
        var filtro = { "order.id": id }

        MercadoPago.payment.search({
            qs: filtro
        }).then(async data => {
            console.log(data)
            console.log('-------------------------')
            console.log(data.body)
            console.log('-------------------------')
            console.log(data.body.results[0])
            console.log('-------------------------')
            var results = data.body.results[0]
            var external_reference = results.external_reference
            if (results.barcode == undefined) {
                var barcode = 0
            }else{
                var barcode = results.barcode.content
            }
            console.log(barcode)
            try {

                var dadosPagamentos = await knex("dadospagamentos").select("clienteId", "carrinhoId").where({ dadosId: external_reference }).whereIn("status", ["approved", "authorized"])

                console.log(dadosPagamentos)

                if (dadosPagamentos[0] != "" && dadosPagamentos[0] != undefined) {

                    console.log("Pagamento efetivado")
                    console.log(dadosPagamentos)

                } else {

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
                        codigoDeBarras:barcode,
                        clienteId: dadosVendas[0].clienteId,
                        carrinhoId: dadosVendas[0].carrinhoId,
                        status: results.status_detail,
                        descricao: results.description,
                        metodoPagamento: results.payment_method_id,
                        createdAt: results.date_created,
                        updatedAt: results.date_created
                    }).then(async () => {
                        console.log("Forma de pagamento adicionada bb")
                        var cliente = await Cliente.findByPk(dadosVendas[0].clienteId)

                        // Carrinho.update({
                        //     status: false
                        // }, { where: { id: dadosVendas[0].carrinhoId } }).then(()=>{
                        //     console.log("Carrinho inativado")
                        // })
                        try {
                            var emailASerEnviado = {
                                from: 'poudeyvis007@gmail.com',
                                to: cliente.email,
                                subject: `Compra dos produtos: ${results.description}`,
                                text: 'Sua compra foi efetivada com sucesso ' + cliente.nome + " /q Codigo: " + external_reference
                            };

                            remetente.sendMail(emailASerEnviado, function (error) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log("Email enviado com sucesso");
                                }
                            });
                        } catch (err) {
                            console.log(err)
                        } finally {
                            res.send("ok")
                        }

                    })
                }
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