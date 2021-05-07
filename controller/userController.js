const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")


router.get("/user",(res,res)=>{
    user = req.session.usu
    if(user != undefined){
        knex("clientes").select().where({id:user.id})
    }
})


module.exports = router