const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const Carrinho = require("../Databases/client/Carrinho")
const Cliente = require("../Databases/client/Cliente")
const CodItens = require("../Databases/client/CodItens")
const auth = require("../middlewares/adminAuth")

router.post("/carrinho/adicionar", auth, async (req, res) => {
    var usuario = req.session.cli
    var codItem = req.body.codItem
    var quantidadeItem = req.body.quantidadeItem
    var refcoluna = req.body.refcoluna
    var reflinha = req.body.reflinha

    if (refcoluna == '') {
        refcoluna = 0
    }
    if (reflinha == '') {
        reflinha = 0
    }

    var produto = await knex("produtos").select().where({ "produtos.id": codItem }).innerJoin("precos", "produtos.id", "precos.produtoId")
    console.log(produto)


    var carrinho = await Carrinho.findOne({ where: { clienteId: usuario.id } })
    if (carrinho.quantidade == undefined) {
        carrinho.quantidade = 0
    }

    var codItems = await CodItens.findOne({ where: { produtoId: codItem, refcoluna: refcoluna, reflinha: reflinha, carrinhoId: carrinho.id } })

    if (codItems != undefined) {

        var quantidadeTotalCarrinho = parseInt(carrinho.quantidade) - parseInt(codItems.quantidade)

        quantidadeItem = parseInt(quantidadeItem) + parseInt(codItems.quantidade)
        quantidadeTotalCarrinho = parseInt(quantidadeTotalCarrinho) + parseInt(quantidadeItem)

        var precoTotalItem  = produto[0].venda * parseInt(quantidadeItem)

        var precoTotalCarrinho = (parseFloat(carrinho.precoTotal)-parseInt(codItems.precoTotalItem)) + parseFloat(precoTotalItem)
        CodItens.update({
            quantidade: quantidadeItem,
            precoTotalItem: precoTotalItem
        }, { where: { id: codItems.id } }).then(resp => {
            console.log({ resp: "Foi realizado o ajuste" })
        })

    } else {
        var precoTotalItem = produto[0].venda * quantidadeItem

        CodItens.create({
            produtoId: codItem,
            quantidade: quantidadeItem,
            refcoluna: refcoluna,
            reflinha: reflinha,
            carrinhoId: carrinho.id,
            precoUnit: produto[0].venda,
            precoTotalItem: precoTotalItem
        }).then(resp => {
            console.log({ resp: "Foi realizado a adição" })
        })
        var quantidadeTotalCarrinho = parseInt(carrinho.quantidade) + parseInt(quantidadeItem)
        var precoTotalCarrinho = parseFloat(carrinho.precoTotal) + parseFloat(precoTotalItem)
    }
    
    Carrinho.update({
        quantidade: quantidadeTotalCarrinho,
        precoTotal: precoTotalCarrinho
    }, { where: { id: carrinho.id } }).then(() => {
        res.json({ resp: "Foi adicionado " + quantidadeItem + " Itens ao seu Carrinho" })
    }).catch(() => {
        res.json({ resp: "Erro: Não poi possivel adicionar os itens ao carrinho, Tente novamente" })
    })

})

router.get("/carrinho/caixa", auth, async (req, res) => {
    var usuario = req.session.cli
    if (usuario != undefined) {
        var cliente = await Cliente.findByPk(usuario.id)
        var carrinho = await Carrinho.findOne({ where: { clienteId: cliente.id } })
        var codItens = await CodItens.findAll({ where: { carrinhoId: carrinho.id } })
        var idsProdutos = []
        codItens.forEach((codItem) => {
            idsProdutos.push(codItem.produtoId)
        })
        var produtos = await knex("produtos").select().whereIn('id', idsProdutos).andWhere({ status: true })
        var imagens = await knex("imagens").select().whereIn("produtoId", idsProdutos)
        var precos = await knex("precos").select().whereIn("produtoId", idsProdutos)
        // var grades = await knex("grades").select().whereIn('id',).innerJoin()
        res.render("carrinho/carrinho", { cliente: cliente, carrinho: carrinho, codItens: codItens, produtos: produtos, imagens: imagens, precos: precos })

    } else {
        res.redirect("/logar")
    }
})

module.exports = router