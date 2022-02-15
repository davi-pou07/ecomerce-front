const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")

router.get("/produto/:id", async (req, res) => {
    produtoId = req.params.id
    try {
        var produto = await knex("produtos").select().where({ id: produtoId, status: true })
        var produtos = await knex("produtos").select().where({ status: true })
        var produtosIds = []
        produtos.forEach(produto => {
            produtosIds.push(produto.id)
        });

        var categoria = await knex("categorias").select().where({ id: produto[0].categoriaId })
        var imagems = await knex("imagens").select().where({ produtoId: produto[0].id })
        var imagens = await knex("imagens").select().whereIn('produtoId',produtosIds)
        var preco = await knex("precos").select().where({ produtoId: produto[0].id })
        var precos = await knex("precos").select().whereIn('produtoId',produtosIds)
        var grade = await knex("grades").select().where({ id: produto[0].gradeId })
        var grades = await knex.from("estoques").innerJoin("g_linhas", "estoques.reflinha", "g_linhas.id").innerJoin("g_colunas", "estoques.refcoluna", "g_colunas.id").where("estoques.produtoId", "=", produto[0].id).andWhere({ "estoques.status": true })


        var marca = await knex("marcas").select().where({ id: produto[0].marcaId })
        var material = await knex("materiais").select().where({ id: produto[0].materialId })
        if (marca[0] == undefined) {
            marca[0] = { id: 0 }
        }
        if (material[0] == undefined) {
            material[0] = { id: 0 }
        }
        res.render("produto/pedido", { produto: produto[0], categoria: categoria[0], imagems: imagems, preco: preco[0], produtos: produtos, precos: precos, imagens: imagens, grades: grades, marca: marca[0],material: material[0], grade: grade[0] })
    } catch (error) {
        console.log(error)
        res.json(error)
    }
})

router.get("/produto/:produtoId/:reflinha/refcoluna", async (req, res) => {
    var produtoId = req.params.produtoId
    var reflinha = req.params.reflinha
    try {
        var colunas = await knex.from("estoques").innerJoin("g_colunas", "estoques.refcoluna", "g_colunas.id").where({ "estoques.produtoId": produtoId, "estoques.reflinha": reflinha, "estoques.status": true })
        res.json({ colunas: colunas })
    } catch {
        res.json({ erro: "Ocorreu um erro ao identificar as colunas" })
    }
})


module.exports = router