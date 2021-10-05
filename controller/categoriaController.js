const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")

router.get("/categorias",async(req,res)=>{
    var categorias = await knex("categorias").select().where({status:true,destaque:true})
    res.json({categorias:categorias})
})

router.get("/categoria/:id", async (req, res) => {
    var categoriaId = req.params.id

    var categoria = await knex("categorias").select().where({ id: categoriaId,status:true,destaque:true })
    var produtos = await knex("produtos").select().where({categoriaId:categoria[0].id,status:true})
    var produtosIds = []
    produtos.forEach(produto => {
        produtosIds.push(produto.id)
    });
    var imagens = await knex("imagens").select().whereIn('produtoId',produtosIds)
    var precos = await knex("precos").select().whereIn('produtoId',produtosIds)

    res.render("categorias/categoria", { categoria: categoria[0],produtos:produtos,precos:precos,imagens:imagens})

})

module.exports = router