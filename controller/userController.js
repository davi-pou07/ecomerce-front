const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")


router.get("/user",(req,res)=>{
    user = req.session.usu
    if(user != undefined){
        knex("clientes").select().where({id:user.id})
    }
})

router.get("/user/novo",(req,res) =>{
    res.render("usuario/novo")
})

module.exports = router