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
    if(refcoluna == ''){
        refcoluna = 0
    }
    if(reflinha == ''){
        reflinha = 0
    }
    console.log({'usuario':usuario,'codItem':codItem,'quantidadeItem':quantidadeItem,'rfcoluna':refcoluna,'reflinha':reflinha})
    var carrinho = await Carrinho.findOne({where:{clienteId:usuario.id}})
    if(carrinho.quantidade == undefined){
        carrinho.quantidade = 0
    }
    CodItens.create({
        produtoId: codItem,
        quantidade: quantidadeItem,
        refcoluna: refcoluna,
        reflinha: reflinha,
        carrinhoId: carrinho.id
    }).then(codItems => {
        console.log({"Coditems":codItem})
        console.log("carrinho.quantidade = "+ carrinho.quantidade)
        console.log("quantidadeItem = "+ quantidadeItem)
            var qtd = carrinho.quantidade + quantidadeItem
            console.log(qtd)
            Carrinho.update({
                quantidade: qtd
            }, { where: { id: carrinho.id } }).then(()=>{
            res.json({ resp: "Foi adicionado " + quantidadeItem + " Itens ao seu Carrinho" })
             }).catch(()=>{
            res.json({ resp: "Erro: Não poi possivel adicionar os itens ao carrinho, Tente novamente" })
            })
    })
})
router.get("/teste",(req,res)=>{
    res.render("carrinho/carrinho")
})

module.exports = router