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
const validator = require('validator')
const validCpf = require("cpf")

var opcaoDePagamentos = [{ id: 1, opcao: "PIX" }, { id: 2, opcao: "MERCADO PAGO" }, { id: 3, opcao: "PAGAR NA ENTREGA" }]

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

// Mercado pago
router.get("/carrinho/finalizarCompra/:opcao", async (req, res) => {
    var usuario = req.session.cli
    //parametros.opcaoDePagamentos
    var escolhaOpcaoPagamento = req.params.opcao
    var opcaoPagamento = await opcaoDePagamentos.find(opcao => opcao.id == escolhaOpcaoPagamento)
    //var usuario = { id: 1 }
    if (usuario != undefined) {
        var cliente = await Cliente.findByPk(usuario.id)

        try {
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })
            var codItens = await CodItens.findAll({ where: { carrinhoId: carrinho.id }, raw: true })
            var dadoEntrega = await knex('dadosentregas').select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })

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
            var data = moment().format()

        } catch (err) {
            res.json({ erro: "Ocorreu um erro, entre em contato com o suporte" })
        }


        if (opcaoPagamento.id == 1) {

            try {
                if (dadosVendas[0] == '' || dadosVendas[0] == undefined) {
                    knex('dadosvendas').insert({
                        dadosId: idUnica,
                        descricao: descricao,
                        quantidade: 1,
                        currency_id: 'BRL',
                        unit_price: precoTotal,
                        emailCliente: cliente.email,
                        clienteId: cliente.id,
                        carrinhoId: carrinho.id,
                        status: 'P',
                        tentativas: 1,
                        createdAt: data,
                        updatedAt: data,
                        opcaoDePagamento: opcaoPagamento.id
                    }).catch(err => {
                        console.log(err)
                    })
                } else {
                    knex('dadosvendas').update({
                        tentativas: parseInt(dadosVendas[0].tentativas) + 1,
                        descricao: descricao,
                        emailCliente: cliente.email,
                        unit_price: precoTotal,
                        opcaoDePagamento: opcaoPagamento.id,
                        updatedAt:moment().format()
                    }).where({ id: dadosVendas[0].id }).catch(err => {
                        console.log(err)
                    })
                }
                try {
                    var dadosVendas = await knex("dadosvendas").select().where({ dadosId: idUnica })
                    var date = moment().format();
                    var qDadosTransicoes = await knex("dadostransicoes").select()
                    knex("dadostransicoes").insert({
                        dadosId: dadosVendas[0].dadosId,
                        status: "pending",
                        clienteId: dadosVendas[0].clienteId,
                        carrinhoId: dadosVendas[0].carrinhoId,
                        statusColetado: "Analise",
                        formaPagamento: "bank_transfer",
                        orderId: '000' + parseInt(qDadosTransicoes.length + 1),
                        createdAt: date,
                        updatedAt: date
                    }).then(async () => {

                        var dadosPagamentosPix = await knex("dadospagamentospixes").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })
                        console.log(dadosVendas[0].dadosId)
                        console.log("----------")
                        console.log('000' + parseInt(qDadosTransicoes.length + 1))

                        var updateDadosPixes = await knex("dadospagamentospixes").update({
                            dadosId: dadosVendas[0].dadosId,
                            ordeId: '000' + parseInt(qDadosTransicoes.length + 1),
                            updatedAt:moment().format()
                        }).where({ id: dadosPagamentosPix[0].id })

                        console.log("passou update")
                        console.log(updateDadosPixes)

                        Carrinho.update({ status: false,updatedAt:moment().format() }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                            var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })
                            console.log("passou update carrinho")

                            res.redirect("/usuario/transicao/" + dadosTransicoes[0].id)
                        })
                    })
                } catch (error) {
                    console.log(error)
                }

            } catch (error) {
                console.log(error)
            }

        } else if (opcaoPagamento.id == 2) {

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
                "payment_methods": {
                    "excluded_payment_methods": [
                        { "id": "" },
                        { "id": "" }
                    ]
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
                            updatedAt: pagamento.date_created,
                            opcaoDePagamento: opcaoPagamento.id
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
                        unit_price: precoTotal,
                        opcaoDePagamento: opcaoPagamento.id,
                        updatedAt:moment().format()
                    }).where({ id: dadosVendas[0].id }).then(() => {
                        return res.redirect(pag.body.init_point)
                    })
                }
            }
            catch (err) {
                return res.send(err.message)
            }
        } else if (opcaoPagamento.id == 3) {
            try {
                if (dadosVendas[0] == '' || dadosVendas[0] == undefined) {
                    knex('dadosvendas').insert({
                        dadosId: idUnica,
                        descricao: descricao,
                        quantidade: 1,
                        currency_id: 'BRL',
                        unit_price: precoTotal,
                        emailCliente: cliente.email,
                        clienteId: cliente.id,
                        carrinhoId: carrinho.id,
                        status: 'P',
                        tentativas: 1,
                        createdAt: data,
                        updatedAt: data,
                        opcaoDePagamento: opcaoPagamento.id
                    }).catch(err => {
                        console.log(err)
                    })
                } else {
                    knex('dadosvendas').update({
                        tentativas: parseInt(dadosVendas[0].tentativas) + 1,
                        descricao: descricao,
                        emailCliente: cliente.email,
                        unit_price: precoTotal,
                        opcaoDePagamento: opcaoPagamento.id,
                        updatedAt:moment().format()
                    }).where({ id: dadosVendas[0].id }).catch(err => {
                        console.log(err)
                    })
                }

                try {

                    var dadosVendas = await knex("dadosvendas").select().where({ dadosId: idUnica })
                    
                    var date = moment().format();

                    var qDadosTransicoes = await knex("dadostransicoes").select()
                    knex("dadostransicoes").insert({
                        dadosId: dadosVendas[0].dadosId,
                        status: "pending",
                        clienteId: dadosVendas[0].clienteId,
                        carrinhoId: dadosVendas[0].carrinhoId,
                        statusColetado: "Analise",
                        formaPagamento: "pagar_na_entrega",
                        orderId: '000' + parseInt(qDadosTransicoes.length + 1),
                        createdAt: date,
                        updatedAt: date
                    }).then(async () => {

                        var DadosPagamentosEntrega = await knex("dadospagamentosentregas").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })

                        var updatePagamentosEntrega = await knex("dadospagamentosentregas").update({
                            dadosId: dadosVendas[0].dadosId,
                            ordeId: '000' + parseInt(qDadosTransicoes.length + 1),
                            updatedAt:moment().format()
                        }).where({ id: DadosPagamentosEntrega[0].id })

                        Carrinho.update({ status: false,updatedAt:moment().format() }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                            var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })

                            res.redirect("/usuario/transicao/" + dadosTransicoes[0].id)
                        })
                    })
                } catch (error) {
                    console.log(error)
                }

            } catch (error) {
                console.log(error)
            }

        } else {
            res.redirect("/")
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
            statusColetado: "Aprovado",
            formaPagamento: param.payment_type,
            orderId: param.merchant_order_id,
            createdAt: date,
            updatedAt: date
        }).then(async () => {
            //parametros.dataprevistaentrega
            var dataPrevista = moment().add(10, "days").format("DD/MM/YYYY")
            await knex("dadosentregas").update({ status: 'Entrega em andamento', dataPrevista: dataPrevista,updatedAt:moment().format() }).where({ clienteId: dadosVendas[0].clienteId, carrinhoId: dadosVendas[0].carrinhoId })
            await knex("dadosvendas").update({ status: 'A',updatedAt:moment().format() }).where({ dadosId: dadosVendas[0].dadosId })
            await Carrinho.update({ status: false,updatedAt:moment().format() }, { where: { id: dadosVendas[0].carrinhoId } })
            var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })

            res.redirect("/usuario/transicao/" + dadosTransicoes[0].id)
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
            statusColetado: "Pendente",
            formaPagamento: param.payment_type,
            orderId: param.merchant_order_id,
            createdAt: date,
            updatedAt: date
        }).then(() => {
            knex("dadosvendas").update({ status: 'P',updatedAt:moment().format() }).where({ dadosId: dadosVendas[0].dadosId })
            Carrinho.update({ status: false,updatedAt:moment().format() }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })
                res.redirect("/usuario/transicao/" + dadosTransicoes[0].id)
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
            statusColetado: "Rejeitado",
            formaPagamento: param.payment_type,
            orderId: param.merchant_order_id,
            createdAt: date,
            updatedAt: date
        }).then(async () => {
            knex("dadosvendas").update({ status: 'F',updatedAt:moment().format() }).where({ dadosId: dadosVendas[0].dadosId })
            var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })
            res.redirect("/usuario/transicao/" + dadosTransicoes[0].id)
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
            var results = data.body.results[0]

            var external_reference = results.external_reference
            if (results.barcode == undefined) {
                var barcode = 0
            } else {
                var barcode = results.barcode.content
            }
            if (results.transaction_details.external_resource_url == undefined) {
                var boletoUrl = 0
            } else {
                var boletoUrl = results.transaction_details.external_resource_url
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
                        codigoDeBarras: barcode,
                        clienteId: dadosVendas[0].clienteId,
                        carrinhoId: dadosVendas[0].carrinhoId,
                        status: results.status,
                        descricao: results.description,
                        metodoPagamento: results.payment_method_id,
                        boletoUrl: boletoUrl,
                        createdAt: results.date_created,
                        updatedAt: results.date_created
                    }).then(async () => {
                        var cliente = await Cliente.findByPk(dadosVendas[0].clienteId)
                        var carrinho = await Carrinho.findByPk(dadosVendas[0].carrinhoId)
                        var dadostransicoes = await knex("dadostransicoes").select().where({ carrinhoId: carrinho.id, clienteId: cliente.id })

                        if (dadostransicoes[0] == undefined) {
                            if (results.status == 'approved' || results.status == 'authorized') {
                                knex("dadostransicoes").insert({
                                    dadosId: results.external_reference,
                                    status: results.status,
                                    clienteId: dadosVendas[0].clienteId,
                                    carrinhoId: dadosVendas[0].carrinhoId,
                                    statusColetado: "Autorizado",
                                    formaPagamento: results.payment_type_id,
                                    orderId: id,
                                    createdAt: results.date_created,
                                    updatedAt: results.date_created
                                }).then(() => {
                                    Carrinho.update({
                                        status: false
                                    }, { where: { id: dadosVendas[0].carrinhoId } }).then(() => {
                                        console.log("Carrinho inativado")
                                    })
                                })
                            } else if (results.status == 'pending') {
                                knex("dadostransicoes").insert({
                                    dadosId: results.external_reference,
                                    status: results.status,
                                    clienteId: dadosVendas[0].clienteId,
                                    carrinhoId: dadosVendas[0].carrinhoId,
                                    statusColetado: "Pendente",
                                    formaPagamento: results.payment_type_id,
                                    orderId: id,
                                    createdAt: results.date_created,
                                    updatedAt: results.date_created
                                }).then(() => {
                                    Carrinho.update({
                                        status: false,
                                        updatedAt:moment().format()
                                    }, { where: { id: dadosVendas[0].carrinhoId } }).then(() => {
                                        console.log("Carrinho inativado")
                                    })
                                })
                            } else {
                                knex("dadostransicoes").insert({
                                    dadosId: results.external_reference,
                                    status: results.status,
                                    clienteId: dadosVendas[0].clienteId,
                                    carrinhoId: dadosVendas[0].carrinhoId,
                                    statusColetado: "Não identificado",
                                    formaPagamento: results.payment_type_id,
                                    orderId: id,
                                    createdAt: results.date_created,
                                    updatedAt: results.date_created
                                })
                            }
                        }

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


// PIX
router.post("/comprovante/pix", auth, async (req, res) => {
    var usuario = req.session.cli
    var comprovante = req.body.comprovante
    if (usuario != undefined) {
        try {
            var cliente = await Cliente.findByPk(usuario.id)
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })

            var dadosPagamentosPix = await knex("dadospagamentospixes").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })
            if (dadosPagamentosPix[0] == undefined) {
                // statusId: 1 - ANALISE. 2 - APROVADO. 3 - REJEITADO. 4- ESTORNADO
                knex("dadospagamentospixes").insert({
                    status: 'Analise',
                    statusId: 1,
                    clienteId: cliente.id,
                    carrinhoId: carrinho.id,
                    comprovante: comprovante,
                    createdAt: moment().format(),
                    updatedAt: moment().format()
                }).then(() => {
                    res.json({ erro: 0 })
                }).catch(err => {
                    console.log(err)
                    res.json({ erro: "Erro ao adicionar comprovante de pagamento" })
                })
            } else {
                knex("dadospagamentospixes").update({
                    status: 'Analise',
                    statusId: 1,
                    clienteId: cliente.id,
                    carrinhoId: carrinho.id,
                    comprovante: comprovante,
                    updatedAt:moment().format()
                }).where({ id: dadosPagamentosPix[0].id }).then(() => {

                    try {
                        var emailASerEnviado = {
                            from: 'poudeyvis007@gmail.com',
                            to: cliente.email,
                            subject: `Compra dos produtos: ${results.description}`,
                            text: 'Prezado ' + cliente.nome + ", recebemos seu comprovante de pagamento pix. Nossa equipe irá avaliar seu comprovante e caso esteja tudo ok retono o contato informando a data de entrega. Temos um prazo de no maximo 48hr para esta lhe respondendo. Para mais duvidas acesse um de nossos canais de atendimento disponibilizados no SITE. Codigo: " + external_reference
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
                        res.json({ erro: 0 })
                    }

                }).catch(err => {
                    console.log(err)
                    res.json({ erro: "Erro ao adicionar comprovante de pagamento" })
                })
            }

        } catch (error) {
            console.log(error)
            res.json({ erro: "Erro ao adicionar comprovante de pagamento, efetue login novamente!" })
        }
    } else {
        res.redirect("/login")
    }
})


// Pagar na entrega
router.post("/solicitar/entrega", auth, async (req, res) => {
    var usuario = req.session.cli
    var { nome, numero, cpf } = req.body
    if (usuario != undefined) {
        if (nome.split(" ").length > 0 && nome != '') {
            if (validator.isMobilePhone(numero, 'pt-BR', false) == true) {
                if (validCpf.isValid(cpf) == true) {
                    try {
                        var cliente = await Cliente.findByPk(usuario.id)
                        var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })
                        var dadosEntrega = await knex("dadosentregas").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })

                        var dadosPagamentosEntrega = await knex("dadospagamentosentregas").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })
                        if (dadosPagamentosEntrega[0] == undefined) {
                            // statusId: 1 - ANALISE. 2 - APROVADO. 3 - REJEITADO. 4- ESTORNADO
                            knex("dadospagamentosentregas").insert({
                                status: 'Analise',
                                statusId: 1,
                                clienteId: cliente.id,
                                carrinhoId: carrinho.id,
                                cpf: cpf,
                                nome: nome,
                                numero: numero,
                                dadosEntragaId: dadosEntrega[0].id,
                                createdAt: moment().format(),
                                updatedAt: moment().format()
                            }).catch(err => {
                                console.log(err)
                                res.json({ erro: "Erro ao solicitar entrega" })
                            })
                        } else {
                            knex("dadospagamentosentregas").update({
                                status: 'Analise',
                                statusId: 1,
                                clienteId: cliente.id,
                                carrinhoId: carrinho.id,
                                cpf: cpf,
                                nome: nome,
                                numero: numero,
                                dadosEntragaId: dadosEntrega[0].id,
                                updatedAt: moment().format()
                            }).where({ id: dadosPagamentosEntrega[0].id }).catch(err => {
                                console.log(err)
                                res.json({ erro: "Erro ao solicitar entrega" })
                            })
                        }
                        try {
                            var emailASerEnviado = {
                                from: 'poudeyvis007@gmail.com',
                                to: cliente.email,
                                subject: `Compra dos produtos: ${results.description}`,
                                text: 'Prezado ' + nome + ", recebemos sua solicitação para pagamentos na entrega. Nossa equipe preza muito pela segurança de nosso produto e de nossos entregadores, entraremos em contato para verificar se é possivel realizar a entrega com pagamento presencial na sua região. Temos um prazo de no maximo 48hr para esta lhe respondendo. Para mais duvidas acesse um de nossos canais de atendimento disponibilizados no SITE. Codigo: " + external_reference
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
                            res.json({ resp: "Solicitação aberta com sucesso!" })
                        }

                    } catch (error) {
                        console.log(error)
                        res.json({ erro: "Erro ao solicitar entrega, efetue login novamente!" })
                    }

                } else {
                    res.json({ erro: 'Numero de CPF inválido', codErro: 4 })
                }
            } else {
                res.json({ erro: 'Numero de telefone invalido', codErro: 3 })
            }
        } else {
            res.json({ erro: 'Nome informado inválido', codErro: 2 })
        }
    } else {
        res.json({ erro: 'Erro ao solicitar entrega, realize o login e tente novamente', codErro: 1 })
    }

})

module.exports = router