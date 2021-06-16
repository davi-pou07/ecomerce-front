const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")

router.get("/categoria/:id", async (req, res) => {
    var categoriaId = req.params.id

    var categoria = await knex("categorias").select().where({ id: categoriaId })
    var produtos = await knex("produtos").select().where({categoriaId:categoria[0].id})
    var imagens = await knex("imagens").select()
    var precos = await knex("precos").select()

    res.render("categorias/categoria", { categoria: categoria[0],produtos:produtos,precos:precos,imagens:imagens})

})

module.exports = router