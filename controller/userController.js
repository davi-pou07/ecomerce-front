const express = require('express')
const router = express.Router()

const knex = require("../Databases/admin/databases")
const Cliente = require("../Databases/client/Cliente")
const Carrinho = require("../Databases/client/Carrinho")
var RecuperaSenha = require("../Databases/client/RecuperaSenha")
const { Op, useInflection } = require("sequelize");
const validator = require('validator')
const validCpf = require("cpf")
const moment = require("moment")
const bcrypt = require("bcryptjs")
const auth = require("../middlewares/adminAuth")
const nodemailer = require("nodemailer");
var uniqid = require('uniqid');

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

router.get("/usuario/cadastrar", (req, res) => {
    res.render("usuario/cadastrar")
})


router.post("/usuario/criar", (req, res) => {
    var nome = req.body.nome
    var email = req.body.email
    var numero = req.body.numero
    var senha = req.body.senha
    var confirm = req.body.confirm
    var isWhats = req.body.isWhats
    var foto = req.body.foto

    if (foto != undefined && foto != '') {
        var image = foto.split("data:image")
        if (image == undefined) {
            var foto = '/img/avatar.jpg'
        }
    } else {
        var foto = '/img/avatar.jpg'
    }

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
                                foto: foto,
                                isWhats: isWhats
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

router.get("/esqueceuSenha", (req, res) => {
    res.render("usuario/esqueceu")
})

router.post("/esqueceu", async (req, res) => {
    var email = req.body.email
    if (email != undefined && email != '') {
        if (validator.isEmail(email)) {
            Cliente.findOne({ where: { email: email.toLowerCase() } }).then(cliente => {
                if (cliente != undefined) {
                    var recuperaSenha = RecuperaSenha.findOne({ where: { status: true, clienteId: cliente.id } })
                    if (recuperaSenha != undefined) {
                        RecuperaSenha.update({ staus: false, aprovado: false }, { where: { id: recuperaSenha.id } })
                    }
                    var idUnica = Math.floor(Math.random() * 9999)
                    while (idUnica.toString().length < 4) {
                        idUnica = '0' + idUnica
                    }

                    RecuperaSenha.create({
                        clienteId: cliente.id,
                        status: true,
                        uniqid: idUnica.toString(),
                        aprovado: false
                    }).then(rec => {
                        try {
                            var emailASerEnviado = {
                                from: 'poudeyvis007@gmail.com',
                                to: cliente.email,
                                subject: `Esqueceu sua senha? Estamos aqui para lhe ajudar!`,
                                text: `Não compartilhe esse codigo com ninguém! O codigo é ${idUnica}`
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
                            res.json({ resp: "Solicitação aberta com sucesso!", id: rec.id })
                        }
                    })
                } else {
                    res.json({ erro: 'Email não encontrado em nossa base, caso seja novo usuario realizar cadastro' })
                }
            }).catch(err => {
                console.log(err)
                res.redirect("/")
            })
        } else {
            res.json({ erro: "Email inválido" })
        }
    } else {
        res.json({ erro: "Email vazio ou inválido" })
    }
})

router.get("/inserirCodigo/:id", (req, res) => {
    var id = req.params.id
    if (id != undefined) {
        RecuperaSenha.findByPk(id).then(async recuperaSenha => {
            if (recuperaSenha != undefined) {
                var cliente = await Cliente.findByPk(recuperaSenha.clienteId)
                res.render("usuario/inserirCodigo", { cliente: cliente })
            } else {
                res.redirect("/esqueceuSenha")
            }
        })
    } else {
        res.redirect("/esqueceuSenha")
    }
})

router.post("/inserirCodigo", async (req, res) => {
    var codigo = req.body.codigo
    console.log(codigo)
    var email = req.body.email

    if (codigo != undefined && codigo != '') {
        if (validator.isEmail(email)) {
            var cliente = await Cliente.findOne({ where: { email: email.toLowerCase() } })
            var recuperaSenha = await RecuperaSenha.findOne({ where: { clienteId: cliente.id, uniqid: codigo, status: true } })
            if (recuperaSenha != undefined) {
                RecuperaSenha.update({ aprovado: true }, { where: { id: recuperaSenha.id } }).then(() => {
                    res.json({ cliente: cliente.id })
                }).catch(err => {
                    console.log(err)
                })
            } else {
                res.json({ erro: "codigo inválido" })
            }
        } else {
            res.json({ erro: 1 })
        }
    } else {
        res.json({ erro: "Codigo inválido ou inexistente" })
    }
})

router.get("/alterarSenha/:clienteId", async (req, res) => {
    var clienteId = req.params.clienteId
    if (!isNaN(clienteId)) {
        var cliente = await Cliente.findByPk(clienteId)
        if (cliente != undefined) {
            var recuperaSenha = await RecuperaSenha.findOne({ where: { clienteId: cliente.id, /*status: true,*/ aprovado: true } })
            console.log(recuperaSenha)
            if (recuperaSenha != undefined) {
                RecuperaSenha.update({ status: false }, { where: { id: recuperaSenha.id } }).then(() => {
                    res.render("usuario/alterarSenha", { cliente: cliente.id })
                })
            } else {
                res.redirect("/esqueceuSenha")
            }
        } else {
            res.redirect("/esqueceuSenha")
        }
    } else {
        res.redirect("/esqueceuSenha")
    }
})

router.post("/alterarSenha", async (req, res) => {
    var { senha, confirm, clienteId } = req.body
    if (senha == confirm && senha != '') {
        var cliente = await Cliente.findByPk(clienteId)
        if (cliente != undefined) {
            var recuperaSenha = await RecuperaSenha.findOne({ where: { clienteId: cliente.id, aprovado: true } })
            if (recuperaSenha != undefined) {
                var salt = bcrypt.genSaltSync(10)
                var hash = bcrypt.hashSync(senha, salt)
                Cliente.update({
                    senha: hash,
                    updatedAt: moment().format()
                }, { where: { id: cliente.id } }).then(() => {

                    var nomeCli = cliente.nome.split(" ")[0]
                    req.session.cli = {
                        id: cliente.id,
                        nome: nomeCli
                    }
                    res.json({ resp: "Senha atualizada com sucesso" })
                }).catch(err => {
                    console.log(err)
                    res.json({ erro: "Erro" })
                })
            } else {
                res.json({ erroId: 2,erro:"Sem autorização" })
            }
        } else {
            res.json({ erroId: 1,erro:"Cliente não definido" })
        }
    } else {
        res.json({ erro: "Senhas inválida" })
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
                                    senha: hash,
                                    updatedAt: moment().format()
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
    // var usuario = {id:1}
    if (usuario != undefined) {
        try {
            var empresa = await knex("empresas").select()
            var cliente = await Cliente.findByPk(usuario.id)
            var dadosTransicao = await knex("dadostransicoes").select().where({ clienteId: cliente.id, id: transicaoId })
            var dadosVenda = await knex("dadosvendas").select().where({ clienteId: cliente.id, dadosId: dadosTransicao[0].dadosId })
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, id: dadosTransicao[0].carrinhoId } })
            var dadosEntrega = await knex("dadosentregas").select().where({ clienteId: cliente.id, carrinhoId: carrinho.id })
            var data = moment(dadosTransicao[0].createdAt).format('DD/MM/YYYY, h:mm:ss a')

            var statusEntrega = await knex("statusentregas").select().where({ statusId: dadosEntrega[0].status })
            dadosEntrega[0].status = statusEntrega[0].status
            if (dadosVenda[0].opcaoDePagamento == 1) {
                var dadosPagamento = await knex("dadospagamentospixes").select().where({ clienteId: cliente.id, dadosId: dadosTransicao[0].dadosId })
                var dataExpiracao = moment(dadosPagamento[0].createdAt).add(2, 'days').format('DD/MM/YYYY')
            } else if (dadosVenda[0].opcaoDePagamento == 2) {
                var dadosPagamento = await knex("dadospagamentos").select().where({ clienteId: cliente.id, dadosId: dadosTransicao[0].dadosId })
                var dataExpiracao = moment(dadosPagamento[0].dataExpiracao).format('DD/MM/YYYY')
            } else if (dadosVenda[0].opcaoDePagamento == 3) {
                var dadosPagamento = await knex("dadospagamentosentregas").select().where({ clienteId: cliente.id, dadosId: dadosTransicao[0].dadosId })
                var dataExpiracao = moment(dadosPagamento[0].createdAt).add(2, 'days').format('DD/MM/YYYY')
            }
            // dadosTransicao[0].status = 'approved'
            // dadosTransicao[0].statusColetado = 'Aprovado'

            // dadosTransicao[0].status = 'refunded'
            // dadosTransicao[0].statusColetado = 'Estornado'

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