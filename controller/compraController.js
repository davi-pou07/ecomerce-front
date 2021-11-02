const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")

var moment = require('moment');
var uniqid = require('uniqid');
const validator = require('validator')
const validCpf = require("cpf")
const nodemailer = require("nodemailer");
const MercadoPago = require("mercadopago");

const Cliente = require('../Databases/client/Cliente');
const CodItens = require("../Databases/client/CodItens")
const Carrinho = require("../Databases/client/Carrinho");

// statusId: 1 - ANALISE. 2 - APROVADO. 3 - REJEITADO. 4- ESTORNADO
const opcaoDePagamentos = [{ id: 1, opcao: "PIX" }, { id: 2, opcao: "MERCADO PAGO" }, { id: 3, opcao: "PAGAR NA ENTREGA" }]
const StatusVenda = [{ id: 1, status: "Pendente" }, { id: 2, status: "Autorizado" }, { id: 3, status: "Cancelado" }]
const StatusPagamento = [{ id: 1, status: "Analise" }, { id: 2, status: "Aprovado" }, { id: 3, status: "Rejeitado" }, { id: 4, status: "Cancelado" }, { id: 5, status: "Pendente" }]
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
        pass: "99965511auri"
    }
});

// Mercado pago
router.get("/carrinho/finalizarCompra/:opcao", async (req, res) => {
    var usuario = req.session.cli
    // svar usuario = { id: 1 }
    var escolhaOpcaoPagamento = req.params.opcao
    var opcaoPagamento = await opcaoDePagamentos.find(opcao => opcao.id == escolhaOpcaoPagamento)
    var cliente = await Cliente.findByPk(usuario.id)
    //var usuario = { id: 1 }

    if (usuario != undefined && cliente != undefined) {

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

            var ordeNum = Math.floor(Math.random() * 9999)
            while (ordeNum.toString().length < 4) {
                ordeNum = '0' + ordeNum
            }

        } catch (err) {
            res.json({ erro: "Ocorreu um erro, entre em contato com o suporte" })
        }
        var statusVenda = StatusVenda.find(st => st.id == 1)

        if (dadosVendas[0] == '' || dadosVendas[0] == undefined) {
            var retornoDadosVendas = await knex('dadosvendas').insert({
                dadosId: idUnica,
                descricao: descricao,
                quantidade: 1,
                currency_id: 'BRL',
                unit_price: precoTotal,
                emailCliente: cliente.email,
                clienteId: cliente.id,
                carrinhoId: carrinho.id,
                statusId: statusVenda.id,
                statusColetado: statusVenda.status,
                tentativas: 1,
                createdAt: data,
                updatedAt: data,
                opcaoDePagamento: opcaoPagamento.id
            })
        } else {
            var retornoDadosVendas = await knex('dadosvendas').update({
                tentativas: parseInt(dadosVendas[0].tentativas) + 1,
                descricao: descricao,
                emailCliente: cliente.email,
                unit_price: precoTotal,
                opcaoDePagamento: opcaoPagamento.id,
                updatedAt: moment().format()
            }).where({ id: dadosVendas[0].id })
        }

        if (opcaoPagamento.id == 1) {
            try {
                var dadosVendas = await knex("dadosvendas").select().where({ dadosId: idUnica })
                var date = moment().format();
                var dadosPagamentos = await knex("dadospagamentos").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })

                var updateDadosPagamentos = await knex("dadospagamentos").update({
                    dadosId: dadosVendas[0].dadosId,
                    ordeId: ordeNum,
                    updatedAt: moment().format(),
                    totalPago:dadosVendas[0].unit_price
                }).where({ id: dadosPagamentos[0].id })

                Carrinho.update({ status: false, updatedAt: moment().format() }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                    res.redirect("/usuario/transicao/" + dadosVendas[0].dadosId)
                })
            } catch (error) {
                console.log(error)
            }
        } else if (opcaoPagamento.id == 2) {
            var dadosVendas = await knex("dadosvendas").select().where({ dadosId: idUnica })

            var dados = {
                items: [
                    item = {
                        id: dadosVendas[0].dadosId,
                        title: dadosVendas[0].descricao,
                        quantity: 1,
                        currency_id: dadosVendas[0].currency_id,
                        unit_price: dadosVendas[0].unit_price
                    }
                ],
                payer: {
                    email: cliente.email,
                    userId: cliente.id,
                    carrinhoId: carrinho.id
                },
                "payment_methods": {
                    "excluded_payment_methods": [
                        { "id": "pec" },
                        { "id": "bolbradesco" }
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
                return res.redirect(pag.body.init_point)
            } catch (err) {
                console.log(err)
            }

        } else if (opcaoPagamento.id == 3) {
            try {
                console.log("Chegou aqui no dadospagamentos 3")
                console.log(idUnica)
                if (dadosVendas[0] == '' || dadosVendas[0] == undefined) {
                    await knex('dadosvendas').insert({
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
                    })
                } else {
                    await knex('dadosvendas').update({
                        tentativas: parseInt(dadosVendas[0].tentativas) + 1,
                        descricao: descricao,
                        emailCliente: cliente.email,
                        unit_price: precoTotal,
                        opcaoDePagamento: opcaoPagamento.id,
                        updatedAt: moment().format()
                    }).where({ id: dadosVendas[0].id })
                }
            } catch (error) {
                console.log(error)
            }
            var dadosVendas = await knex("dadosvendas").select().where({ dadosId: idUnica })
            console.log("--------------dadosVendas-----------")
            console.log(dadosVendas)

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
                    updatedAt: moment().format()
                }).where({ id: DadosPagamentosEntrega[0].id })

                Carrinho.update({ status: false, updatedAt: moment().format() }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                    var dadosTransicoes = await knex("dadostransicoes").select().where({ dadosId: dadosVendas[0].dadosId })

                    res.redirect("/usuario/transicao/" + dadosTransicoes[0].id)
                })
            })
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
            var statusEntrega = await knex("statusentregas").select().where({ statusId: 2 })

            await knex("dadosentregas").update({ status: statusEntrega[0].statusId, dataPrevista: dataPrevista, updatedAt: moment().format() }).where({ clienteId: dadosVendas[0].clienteId, carrinhoId: dadosVendas[0].carrinhoId })
            await knex("dadosvendas").update({ status: 'A', updatedAt: moment().format() }).where({ dadosId: dadosVendas[0].dadosId })
            await Carrinho.update({ status: false, updatedAt: moment().format() }, { where: { id: dadosVendas[0].carrinhoId } })
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
            knex("dadosvendas").update({ status: 'P', updatedAt: moment().format() }).where({ dadosId: dadosVendas[0].dadosId })
            Carrinho.update({ status: false, updatedAt: moment().format() }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
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
            knex("dadosvendas").update({ status: 'F', updatedAt: moment().format() }).where({ dadosId: dadosVendas[0].dadosId })
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
            console.log(results)
            var external_reference = results.external_reference

            try {

                var dadosPagamentos = await knex("dadospagamentos").select("clienteId", "carrinhoId").where({ dadosId: external_reference, statusId: 2 })

                console.log(dadosPagamentos)

                if (dadosPagamentos[0] != "" && dadosPagamentos[0] != undefined) {

                    console.log("Pagamento efetivado")
                    console.log(dadosPagamentos)

                } else {

                    if (results.status == "pending" || results.status == "in_process" || results.status == "in_mediation") {
                        var statusPagamento = StatusPagamento.find(sp => sp.id == 5)
                    } else if (results.status == "approved" || results.status == "authorized") {
                        var statusPagamento = StatusPagamento.find(sp => sp.id == 2)
                    } else if (results.status == "rejected" || results.status == "charged_back") {
                        var statusPagamento = StatusPagamento.find(sp => sp.id == 3)
                    } else if (results.status == "cancelled" || results.status == "refunded") {
                        var statusPagamento = StatusPagamento.find(sp => sp.id == 4)
                    }


                    var dadosVendas = await knex("dadosvendas").select().where({ dadosId: external_reference })
                    knex('dadospagamentos').insert({
                        dadosId: dadosVendas[0].dadosId,
                        dataAutorizacao: results.date_approved,
                        totalPago: results.transaction_details.total_paid_amount,
                        valorBrutoRecebido: results.transaction_details.installment_amount,
                        tipoDePagamento: results.payment_type_id,
                        ordeId: id,
                        detalhePagamento: results.status_detail,
                        dataExpiracao: results.date_of_expiration,
                        clienteId: dadosVendas[0].clienteId,
                        carrinhoId: dadosVendas[0].carrinhoId,
                        statusId: statusPagamento.id,
                        descricao: results.description,
                        metodoPagamento: results.payment_method_id,
                        createdAt: results.date_created,
                        updatedAt: results.date_created
                    }).then(async () => {
                        var cliente = await Cliente.findByPk(dadosVendas[0].clienteId)
                        var carrinho = await Carrinho.findByPk(dadosVendas[0].carrinhoId)

                        Carrinho.update({
                            status: false
                        }, { where: { id: dadosVendas[0].carrinhoId } }).then(async () => {
                            console.log("Carrinho inativado")

                            var statusEntrega = await knex("statusentregas").select().where({ statusId: 2 })
                            var dataPrevista = moment().add(10, "days").format("DD/MM/YYYY")
                            await knex("dadosentregas").update({ status: statusEntrega[0].statusId, dataPrevista: dataPrevista, updatedAt: moment().format() }).where({ clienteId: dadosVendas[0].clienteId, carrinhoId: dadosVendas[0].carrinhoId })
                        })

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
    var cliente = await Cliente.findByPk(usuario.id)
    var comprovante = req.body.comprovante
    var statusPagamento = StatusPagamento.find(st => st.id == 1)

    if (usuario != undefined && cliente != undefined) {
        try {
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })
            var dadosPagamentos = await knex("dadospagamentos").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })

            if (dadosPagamentos[0] == undefined) {
                // statusId: 1 - ANALISE. 2 - APROVADO. 3 - REJEITADO. 4- ESTORNADO
                knex("dadospagamentos").insert({
                    statusId: statusPagamento.id,
                    clienteId: cliente.id,
                    carrinhoId: carrinho.id,
                    comprovante: comprovante,
                    createdAt: moment().format(),
                    updatedAt: moment().format(),
                    detalhePagamento: "Pix",
                    tipoDePagamento:'bank_transfer',
                    metodoPagamento:"Pix",
                    dataExpiracao:moment().add(2, 'days').format(),
                }).then(() => {
                    res.json({ erro: 0 })
                }).catch(err => {
                    console.log(err)
                    console.log("--------------------------------")
                    res.json({ erro: "Erro ao adicionar comprovante de pagamento" })
                })
            } else {
                knex("dadospagamentos").update({
                    statusId:statusPagamento.id,
                    clienteId: cliente.id,
                    carrinhoId: carrinho.id,
                    comprovante: comprovante,
                    detalhePagamento: "Pix",
                    tipoDePagamento:'bank_transfer',
                    metodoPagamento:"Pix",
                    dataExpiracao:moment().add(2, 'days').format(),
                    updatedAt: moment().format()
                }).where({ id: dadosPagamentos[0].id }).then(() => {

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
                    console.log("--------------------------------")
                    } finally {
                        res.json({ erro: 0 })
                    }

                }).catch(err => {
                    console.log(err)
                    console.log("--------------------------------")
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
                                subject: `Compra dos produtos na data ${moment().format()}`,
                                text: 'Prezado ' + nome + ", recebemos sua solicitação para pagamentos na entrega. Nossa equipe preza muito pela segurança de nosso produto e de nossos entregadores, entraremos em contato para verificar se é possivel realizar a entrega com pagamento presencial na sua região. Temos um prazo de no maximo 48hr para esta lhe respondendo. Para mais duvidas acesse um de nossos canais de atendimento disponibilizados no SITE."
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