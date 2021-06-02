const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")

// router.get("/produto/:id", (req, res) => {
//     produtoId = req.params.id
//     knex("produtos").select().where({ id: produtoId }).then(produto => {
//         knex("produtos").select().then(produtos => {
//             knex("categorias").select().where({ id: produto[0].categoriaId }).then(categoria => {
//                 knex("imagens").select().where({ produtoId: produto[0].id }).then(imagems => {
//                     knex("imagens").select().then(imagens => {
//                         knex("precos").select().where({ produtoId: produto[0].id }).then(preco => {
//                             knex("precos").select().then(precos => {
//                                 knex("estoques").select().where({produtoId:produtoId,status:true}).then(estoques =>{
//                                     knex("grades").select().where({id:produto[0].gradeId}).join("g_linhas","grades.id","=","g_linhas.gradeId").join("g_colunas","grades.id","=","g_colunas.gradeId").then(grades =>{
//                                         res.json(grades)
//                                         // res.render("produto/pedido", { produto: produto[0], categoria: categoria[0], imagems: imagems, preco: preco[0], produtos: produtos, precos: precos, imagens:imagens, estoques:estoques, grades:grades })
//                                     })

//                                 }).cath(err=>{})
//                             })
//                         })
//                     })
//                 })
//             })
//         })
//     })
// })

router.get("/produto/:id", async (req, res) => {
    produtoId = req.params.id
    try {
    var produto = await knex("produtos").select().where({ id: produtoId })
    var produtos = await knex("produtos").select()
    var categoria = await knex("categorias").select().where({ id: produto[0].categoriaId })
    var imagems = await knex("imagens").select().where({ produtoId: produto[0].id })
    var imagens = await knex("imagens").select()
    var preco = await knex("precos").select().where({ produtoId: produto[0].id })
    var precos = await knex("precos").select()
    var grades = await knex.from("estoques").innerJoin("g_linhas","estoques.reflinha","g_linhas.id").innerJoin("g_colunas","estoques.refcoluna","g_colunas.id").where({"estoques.produtoId":produtoId,"estoques.status":true})
    console.log(grades)
    res.render("produto/pedido", { produto: produto[0], categoria: categoria[0], imagems: imagems, preco: preco[0], produtos: produtos, precos: precos, imagens:imagens,grades:grades})
    }catch (error) {
        console.log(error)
    }
})

// router.get("/test/:id", async (req,res)=>{
//     produtoId = req.params.id
//     try {
//     var produto = await knex.from("produtos").innerJoin("imagens","produtos.id","imagens.produtoId").innerJoin("precos","produtos.id","precos.produtoId").innerJoin("categorias","produtos.categoriaId","categorias.id").where({ "produtos.id": produtoId })
//     res.json(produto[0])
//     console.log(produto[0].coluna)
//     // var produtos = await knex("produtos").select()
//     // var categoria = await knex("categorias").select().where({ id: produto[0].categoriaId })

//     // var imagens = await knex("imagens").select()
//     // var precos = await knex("precos").select()
//     // res.render("produto/pedido", { produto: produto[0], categoria: categoria[0], imagems: imagems, preco: preco[0], produtos: produtos, precos: precos, imagens:imagens })
//     } catch (error) {
//         console.log(error)
//     }
// })

module.exports = router