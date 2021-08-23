const express = require('express')
const router = express.Router()

const knex = require("../Databases/admin/databases")
const Cliente = require("../Databases/client/Cliente")
const Carrinho = require("../Databases/client/Carrinho")

const { Op, useInflection } = require("sequelize");
const validator = require('validator')
const validCpf = require("cpf")
const moment = require("moment")
const bcrypt = require("bcryptjs")
const auth = require("../middlewares/adminAuth")


router.get("/login", (req, res) => {
    res.render("usuario/login")
})
// INFORMAR SE JA ESTA CADASTRADO O EMAIL OU O CAELULAR
router.post("/usuario/login", (req, res) => {
    var emailLogin = req.body.emailLogin
    var senhaLogin = req.body.senhaLogin

    if (emailLogin != '' && senhaLogin != '') {

        Cliente.findOne({ where: { email: emailLogin.toLowerCase() } }).then(cli => {
            if (cli != undefined) {
                var correct = bcrypt.compareSync(senhaLogin, cli.senha)
                var nomeCli = cli.nome.split(" ")[0]
                if (correct) {
                    req.session.cli = {
                        id: cli.id,
                        nome: nomeCli
                    }
                    res.json({ resp: `Usuario ${req.session.cli.nome} logado` })
                } else {
                    res.json({ erro: "Credenciais inválidas" })
                }
            } else {
                res.json({ erro: "Usuario não cadastrado, REGISTRA-SE JÁ!" })
            }
        })
    } else {
        res.json({ erro: "Dados vazios" })
    }
})

router.post("/usuario/criar", (req, res) => {
    var nome = req.body.nome
    var email = req.body.email
    var numero = req.body.numero
    var senha = req.body.senha
    var confirm = req.body.confirm
    var foto = '/img/avatar.jpg'
    if (nome != '' && email != '' && senha != '' && confirm != '') {
        if (senha == confirm) {
            var salt = bcrypt.genSaltSync(10)
            var hash = bcrypt.hashSync(senha, salt)
            if (validator.isEmail(email) == true) {
                if (validator.isMobilePhone(numero, 'pt-BR', false) == true) {
                    Cliente.findOne({ where: { [Op.or]: [{ email: email }, { numero: numero }] } }).then(clienteCadastrado => {
                        if (clienteCadastrado == undefined) {
                            Cliente.create({
                                nome: nome,
                                email: email.toLowerCase(),
                                numero: numero,
                                senha: hash,
                                status: true,
                                foto: foto
                            }).then(cliente => {
                                Carrinho.create({
                                    status: true,
                                    clienteId: cliente.id,
                                    precoTotal: 0
                                }).then(carrinho => {
                                    var nomeCli = cliente.nome.split(" ")[0]
                                    req.session.cli = {
                                        id: cliente.id,
                                        nome: nomeCli
                                    }
                                    res.json({ resp: "Cliente cadastrado com sucesso" })
                                })
                            })
                        } else {
                            res.json({ erro: "Ja existe um cliente cadastrado com esses dados, por gentileza efetue o login" })
                        }
                    })
                } else {
                    res.json({ erro: "Número de celular inválido" })
                }
            } else {
                res.json({ erro: "Endereço de e-mail inválido" })
            }
        } else {
            res.json({ erro: "Credenciais inválida" })
        }
    } else {
        res.json({ erro: "Dados vazios" })
    }
})

router.get("/usuario/logado", async (req, res) => {
    var usuario = req.session.cli
    if (usuario != undefined) {
        try {

            var cliente = await Cliente.findByPk(usuario.id)
            if (cliente != undefined) {
                var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })
                if (carrinho != undefined && carrinho.status != false) {

                    var nome = cliente.nome.split(" ")[0]
                    var sobrenome = cliente.nome.split(" ")[1]

                    if (sobrenome != undefined) {
                        var nomeCli = `${nome} ${sobrenome}`
                    } else {
                        var nomeCli = `${nome}`
                    }
                    res.json({ carrinho: carrinho, clienteId: cliente.id, clienteNome: nomeCli, clienteFoto: cliente.foto, clienteValidado: cliente.validado })
                } else {
                    Carrinho.create({
                        quantidade: 0,
                        status: true,
                        clienteId: cliente.id,
                        precoTotal: 0
                    }).then(() => {
                        res.send("Carrinho criado")
                    })
                }
            } else {
                res.redirect("/erro")
            }
        } catch {
            res.redirect("/erroBanco")
        }
    } else {
        res.json({ clienteId: null })
    }
})

router.get("/usuario/edit/", auth, async (req, res) => {
    var usuario = req.session.cli.id
    if (usuario != undefined) {
        var cliente = await Cliente.findByPk(usuario)
        if (cliente != undefined) {
            res.render("usuario/edit", { cliente: { nome: cliente.nome, cpf: cliente.cpf, numero: cliente.numero, email: cliente.email, validado: cliente.validado, dataNasc: cliente.dataNasc, foto: cliente.foto } })
        } else {
            res.redirect("/login")
        }
    } else {
        res.redirect("erro")
    }
})

router.post("/usuario/editar", auth, async (req, res) => {
    var usuario = req.session.cli.id
    var nome = req.body.nome
    var numero = req.body.numero
    var email = req.body.email
    var foto = req.body.foto

    var senhaAtual = req.body.senhaAtual
    var senha = req.body.senha
    var confirm = req.body.confirm
    var cliente = await Cliente.findByPk(usuario)
    if (usuario != undefined) {
        if (senha == '' || confirm == '' || senhaAtual == '') {
            senhaAtual = undefined
            confirm = 0
            senha = confirm
            var correct = true
        } else {
            var correct = bcrypt.compareSync(senhaAtual, cliente.senha)
        }
        if (correct) {
            if (senha == confirm && senha != senhaAtual) {
                if (senhaAtual != undefined) {
                    var salt = bcrypt.genSaltSync(10)
                    var hash = bcrypt.hashSync(senha, salt)
                } else {
                    var hash = cliente.senha
                }
                if (nome != '' && numero != '' && email != '') {

                    if (validator.isEmail(email) == true) {

                        if (validator.isMobilePhone(numero, 'pt-BR', false) == true) {

                            var cli = await Cliente.findOne({ where: { [Op.or]: [{ numero: numero }, { email: email }] } })
                            if (cli == undefined || (cli.email == cliente.email && cli.numero == cliente.numero)) {
                                if (foto == '' || foto == undefined) {
                                    foto = cliente.foto
                                }
                                Cliente.update({
                                    nome: nome,
                                    numero: numero,
                                    email: email.toLowerCase(),
                                    foto: foto,
                                    senha: hash
                                }, { where: { id: usuario } }).then(cliente => {
                                    res.json({ resp: "Informações atualizadas" })
                                })
                            } else {
                                res.json({ erro: "Ja existe um cliente cadastrado com esses dados" })
                            }

                        } else {
                            res.json({ erro: "Numero de telefone inváldo" })
                        }
                    } else {
                        res.json({ erro: "Email inváldo" })
                    }
                } else {
                    res.json({ erro: "Dados vazios" })
                }
            } else {
                res.json({ resp: "Senhas não são iguais" })
            }
        } else {
            res.json({ resp: "Senhas incorreta" })
        }
    } else {
        res.redirect("/login")
    }
})

router.get("/usuario/historico", async (req, res) => {
    var usuario = req.session.cli
    //var usuario = {id:1}
    if (usuario != undefined) {
        try {
            var cliente = await Cliente.findByPk(usuario.id)
            var carrinhos = await Carrinho.findAll({ where: { clienteId: cliente.id } })
            var dadosVendas = await knex("dadosvendas").select().where({ clienteId: cliente.id })
            var dadosTransicoes = await knex("dadostransicoes").select().where({ clienteId: cliente.id })
            var datas = []
            dadosTransicoes.forEach(dados => {
                var data = moment(dados.createdAt).format('Do MMMM YYYY, h:mm:ss a')
                var dado = { id: dados.id, createdAt: data }
                datas.push(dado)
            })
            res.render("usuario/historico", { nome: cliente.nome, id: cliente.id, foto: cliente.foto, carrinhos: carrinhos, dadosVendas: dadosVendas, dadosTransicoes: dadosTransicoes, datas: datas })
        } catch (err) {
            console.log(err)
            res.redirect("/")
        }
    } else {
        res.redirect("/login")
    }

})

router.get("/usuario/transicao/:transicaoId", async (req, res) => {
    var usuario = req.session.cli
    var transicaoId = req.params.transicaoId
    //var usuario = {id:1}
    if (usuario != undefined) {
        try {
            var empresa = await knex("empresas").select()
            var cliente = await Cliente.findByPk(usuario.id)
            var dadosTransicao = await knex("dadostransicoes").select().where({ clienteId: cliente.id, id: transicaoId })
            var dadosVenda = await knex("dadosvendas").select().where({ clienteId: cliente.id, dadosId: dadosTransicao[0].dadosId })
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, id: dadosTransicao[0].carrinhoId } })
            var dadosEntrega = await knex("dadosentregas").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })
            var data = moment(dadosTransicao[0].createdAt).format('DD/MM/YYYY, h:mm:ss a')

            if (dadosVenda[0].opcaoDePagamento == 1) {
                var dadosPagamento = await knex("dadospagamentospixes").select().where({ clienteId: cliente.id, dadosId: dadosTransicao[0].dadosId })
                console.log("-----dadosPagamento----")
                console.log(dadosPagamento)
                var dataExpiracao = moment(dadosPagamento[0].createdAt).add(2, 'days').format('DD/MM/YYYY')
            } else if (dadosVenda[0].opcaoDePagamento == 2) {
                var dadosPagamento = await knex("dadospagamentos").select().where({ clienteId: cliente.id, dadosId: dadosTransicao[0].dadosId })
                var dataExpiracao = moment(dadosPagamento[0].dataExpiracao).format('DD/MM/YYYY')
            }
            console.log("----dadosTransicao-----")
            console.log(dadosTransicao)
            console.log("----dadosVenda-----")
            console.log(dadosVenda)
            console.log("-----dadosPagamento----")
            console.log(dadosPagamento)
            res.render("usuario/transicao", { nome: cliente.nome, id: cliente.id, foto: cliente.foto, carrinho: carrinho, dadosVenda: dadosVenda[0], dadosTransicao: dadosTransicao[0], data: data, dataExpiracao: dataExpiracao, dadosPagamento: dadosPagamento[0], dadosEntrega: dadosEntrega[0], empresa: empresa[0] })
        } catch (err) {
            console.log(err)
            res.redirect("/")
        }
    } else {
        res.redirect("/login")
    }

})



router.get("/logout", (req, res) => {
    req.session.cli = undefined
    res.redirect("/")
})

module.exports = router