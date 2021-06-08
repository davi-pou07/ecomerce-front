const express = require('express')
const router = express.Router()

const knex = require("../Databases/admin/databases")
const Cliente = require("../Databases/client/Cliente")
const Carrinho = require("../Databases/client/Carrinho")

const { Op } = require("sequelize");
const validator = require('validator')
const validCpf = require("cpf")
const moment = require("moment")
const bcrypt = require("bcryptjs")

router.get("/user", (req, res) => {
   var cli = req.session.cli
    if (cli != undefined) {
        knex("clientes").select().where({ id: cli.id })
    }
})

router.get("/user/novo", (req, res) => {
    res.render("usuario/novo")
})

// router.post("/criar/usuario", (req, res) => {
//     var foto = req.body.foto
//     var nome = req.body.nome
//     var sobrenome = req.body.sobrenome
//     var email = req.body.email
//     var celular = req.body.celular
//     var senha = req.body.senha
//     var confirm = req.body.confirm
//     var cpf = req.body.cpf
//     var nas = req.body.dataNasc
//     var dataNasc = moment(nas).format("YYYYMMDD")
//     if (nome != "" && sobrenome != "" && email != "" && celular != "" && senha != "" && confirm != "" && cpf != "" && dataNasc != "") {
//         if (validator.isEmail(email) == true) {
//             if (validator.isMobilePhone(celular, 'pt-BR', false) == true) {
//                 if (validCpf.isValid(cpf) == true) {
//                     var idade = moment().diff(dataNasc, "years")
//                     if (parseInt(idade) >= 13) {
//                         if (senha == confirm) {
//                             var salt = bcrypt.genSaltSync(10)
//                             var hash = bcrypt.hashSync(senha, salt)
//                             Cliente.findOne({ where: { [Op.or]: [{ email: email }, { celular: celular }, { cpf: cpf }] } }).then(clienteCadastrado => {
//                                 if (clienteCadastrado == undefined) {
//                                     Cliente.create({
//                                         nome: nome,
//                                         sobrenome: sobrenome,
//                                         status: true,
//                                         cpf: cpf,
//                                         celular: celular,
//                                         email: email,
//                                         senha: hash,
//                                         dataNasc: dataNasc,
//                                         foto: foto
//                                     }).then(cliente => {
//                                         Carrinho.create({
//                                             status:true,
//                                             clienteId:cliente.id
//                                         }).then(carrinho =>{
//                                             res.json({resp: "Cliente cadastrado com sucesso"})
//                                         })
//                                     })
//                                 } else {
//                                     res.json({ erro: "Cliente ja cadastrado, por favor faça o login" })
//                                 }
//                             })
//                         } else {
//                             res.json({ erro: "Senha inválida" })
//                         }
//                     } else {
//                         res.json({ erro: "Idade inválida para cadastro" })
//                     }
//                 } else {
//                     res.json({ erro: "CPF inválido" })
//                 }
//             } else {
//                 res.json({ erro: "Telefone celular inválido" })
//             }
//         } else {
//             res.json({ erro: "EMAIL inválido" })
//         }
//     } else {
//         res.json({ erro: "Dados não definidos" })
//     }
// })

router.get("/login", (req, res) => {
    res.render("usuario/login")
})

router.post("/usuario/login",(req,res)=>{
    var emailLogin = req.body.emailLogin
    var senhaLogin = req.body.senhaLogin

    if (emailLogin != '' && senhaLogin != '') {

        Cliente.findOne({where:{email:emailLogin}}).then(cli =>{
            if (cli != undefined) {
                var correct = bcrypt.compareSync(senhaLogin,cli.senha)
                var nomeCli = cli.nome.split(" ")[0]
                if (correct) {
                    req.session.cli = {
                        id: cli.id,
                        nome:nomeCli
                    }
                    console.log(`Usuario ${req.session.cli.nome} logado`)
                    console.log("USUARIO LOGADO")
                    res.json({resp:`Usuario ${req.session.cli.nome} logado`})
                } else {
                   res.json({erro:"Credenciais inválidas"}) 
                }
            } else {
               res.json({erro:"Usuario não cadastrado, REGISTRA-SE JÁ!"}) 
            }
        })
    } else {
        res.json({erro:"Dados vazios"})
    }
})

router.post("/usuario/criar", (req, res) => {
    var nome = req.body.nome
    var email = req.body.email
    var numero = req.body.numero
    var senha = req.body.senha
    var confirm = req.body.confirm
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
                                email: email,
                                numero: numero,
                                senha: hash,
                                status: true
                            }).then(cliente => {
                                Carrinho.create({
                                    status: true,
                                    clienteId: cliente.id
                                }).then(carrinho => {
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

module.exports = router