const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")

router.get("/produto/:id",(req,res)=>{
    produtoId = req.params.id
    knex("produtos").select().where({id:produtoId}).then(produto =>{
        knex("categorias").select().where({id:produto[0].categoriaId}).then(categoria =>{
            knex("imagens").select().where({produtoId:produto[0].id}).then(imagens =>{
                res.render("produto/pedido",{produto:produto[0],categoria:categoria[0],imagens:imagens})
            })
        })
    })
})

module.exports = router