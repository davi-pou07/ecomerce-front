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
   var usuario = req.session.cli
     // var usuario = { id: 1 }
    var statusEntrega = await knex("statusentregas").select().where({statusId:1})
    var cep = req.body.cep
    var rua = req.body.rua
    var numero = req.body.numero
    var bairro = req.body.bairro
    var uf = req.body.uf
    var cidade = req.body.cidade
    var complemento = req.body.complemento
    var codigoRastreioInterno = uniqid("Ras-")
    // var status = 'Pagamento Pendente'

    var locaisdeliveries = await knex("locaisdeliveries").select()
    var bai = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    var cid = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")


    var entrega = await locaisdeliveries.find(cidadeEntrega => cidadeEntrega.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") == cid
        && cidadeEntrega.bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") == bai)
    if (entrega == undefined) {
        var entrega = await locaisdeliveries.find(cidadeEntrega => cidadeEntrega.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") == cid && cidadeEntrega.bairro == '')
    }


    if (usuario != undefined) {
        //verifica se bairro / cidade esta cadastrado nos dados
        try {
            var cliente = await Cliente.findByPk(usuario.id)
            var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id, status: true } })

            var dadosEntrega = await knex("dadosentregas").select().where({ carrinhoId: carrinho.id, clienteId: cliente.id })

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
                    status: statusEntrega[0].statusId,
                    valor: entrega.preco,
                    valRecebido:0,
                    createdAt: moment().format(),
                    updatedAt: moment().format()
                }).then(() => {
                    res.json({erro:0})
                }).catch(err => {
                    console.log(err)
                    res.json({erro:1})
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
                    status:  statusEntrega[0].statusId,
                    updatedAt:moment().format(),
                    valRecebido:0
                }).where({ id: dadosEntrega[0].id }).then(() => {
                    res.json({erro:0})
                }).catch(err => {
                    res.json({erro:1})
                })
            }
        } catch (error) {
            res.json({ erro: "N??o foi possivel localizar seus dados, efetue login novamente" })
            console.log(error)
        }
    } else {
        res.json({erro:"Favor efetuar novamente o Login"})
    }

})

module.exports = router