const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")

router.get("/produto/:id", (req, res) => {
    produtoId = req.params.id
    knex("produtos").select().where({ id: produtoId }).then(produto => {
        knex("produtos").select().then(produtos => {
            knex("categorias").select().where({ id: produto[0].categoriaId }).then(categoria => {
                knex("imagens").select().where({ produtoId: produto[0].id }).then(imagems => {
                    knex("imagens").select().then(imagens => {
                        knex("precos").select().where({ produtoId: produto[0].id }).then(preco => {
                            knex("precos").select().then(precos => {
                                res.render("produto/pedido", { produto: produto[0], categoria: categoria[0], imagems: imagems, preco: preco[0], produtos: produtos, precos: precos, imagens:imagens })
                            })
                        })
                    })
                })
            })
        })
    })
})


module.exports = router