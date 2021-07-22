const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const Carrinho = require("../Databases/client/Carrinho")
const Cliente = require("../Databases/client/Cliente")
const auth = require("../middlewares/adminAuth")
var moment = require('moment');
var uniqid = require('uniqid');

router.get("/entrega/locais", (req, res) => {
    knex("locaisdeliveries").select().then(locaisDelivery => {
        res.json(locaisDelivery)
    })
})

router.post("/entrega/adicionar", async (req, res) => {
    // var usuario = req.session.cli
    var usuario = { id: 1 }
    var cep = req.body.cep
    var rua = req.body.rua
    var numero = req.body.numero
    var bairro = req.body.bairro
    var uf = req.body.uf
    var cidade = req.body.cidade
    var complemento = req.body.complemento
    var codigoRastreioInterno = uniqid("Ras-")
    var status = 'Pagamento Pendente'

    var locaisdeliveries = await knex("locaisdeliveries").select()
    var bai = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    var cid = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    console.log(locaisdeliveries)
    console.log('locaisdeliveries ------')
    var entrega = await locaisdeliveries.find(cidadeEntrega => cidadeEntrega.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") == cid
        && cidadeEntrega.bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") == bai)
    if (entrega == undefined) {
        var entrega = await locaisdeliveries.find(cidadeEntrega => cidadeEntrega.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") == cid && cidadeEntrega.bairro == '')
    }
    console.log(entrega)
    console.log('entrega ------')

    if (usuario != undefined) {
        //verifica se bairro / cidade esta cadastrado nos dados
        try {
            var cliente = await Cliente.findByPk(usuario.id)
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })

            var dadosEntrega = await knex("dadosentregas").select().where({ carrinhoId: carrinho.id, clienteId: cliente.id })
            console.log(dadosEntrega[0])

            if (dadosEntrega[0] == undefined) {
                knex("dadosentregas").insert({
                    cep: cep,
                    rua: rua,
                    numero: numero,
                    bairro: bairro,
                    uf: uf,
                    cidade: cidade,
                    complemento: complemento,
                    clienteId: cliente.id,
                    carrinhoId: carrinho.id,
                    codigoRastreioInterno: codigoRastreioInterno,
                    status: status,
                    valor: entrega.preco,
                    createdAt: moment().format(),
                    updatedAt: moment().format()
                }).then(() => {
                    console.log("Salvo dado da entrega")
                }).catch(err => {
                    console.log(err)
                    res.redirect('/')
                })
            } else {
                knex("dadosentregas").update({
                    cep: cep,
                    rua: rua,
                    numero: numero,
                    bairro: bairro,
                    uf: uf,
                    cidade: cidade,
                    complemento: complemento,
                    valor: entrega.preco,
                    codigoRastreioInterno: codigoRastreioInterno,
                    status: status
                }).where({ id: dadosEntrega.id }).then(() => {
                    console.log("Modificado o dado da entrega")
                }).catch(err => {
                    console.log(err)
                    res.redirect('/')
                })
            }
        } catch (error) {
            res.json({ erro: "Não foi possivel localizar seus dados, efetue login novamente" })
            console.log(error)
        }
    } else {
        res.redirect("/logar")
    }

})

module.exports = router