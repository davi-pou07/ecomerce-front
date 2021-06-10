const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const Carrinho = require("../Databases/client/Carrinho")
const CodItens = require("../Databases/client/CodItens")
const auth = require("../middlewares/adminAuth")

router.get("/carrinho/:idCli", (req, res) => {
    var idCli = req.params.idCli
    if (idCli != undefined) {
        if (!isNaN(idCli)) {
            Carrinho.findOne({ where: { clienteId: idCli } }).then(carrinho => {
                res.json(carrinho)
            })
        } else {
            res.json({ err: "ID INCORRETO" })
        }
    } else {

    }
})

router.post("/carrinho/adicionar",auth,async(req, res) => {
    var usuario = req.session.cli
    var codItem = req.body.codItem
    var quantidadeItem = req.body.quantidadeItem
    var refcoluna = req.body.refcoluna
    var reflinha = req.body.reflinha
    var carrinho = await Carrinho.findOne({where:{clienteId:usuario.id}})
    CodItens.create({
        produtoId: codItem,
        quantidade: quantidadeItem,
        refcoluna: refcoluna,
        reflinha: reflinha,
        carrinhoId: carrinho.id
    }).then(codItems => {
            var qtd = parseInt(carrinho.quantidade) + parseInt(quantidadeItem)
            Carrinho.update({
                quantidade: qtd
            }, { where: { id: carrinho.id } }).then(()=>{
            res.json({ resp: "Foi adicionado " + quantidadeItem + " Itens ao seu Carrinho" })
            }).catch(()=>{
            res.json({ resp: "Erro: Não poi possvivl adicionar os itens ao carrinho, Tente novamente" })
            })
    })
})

module.exports = router