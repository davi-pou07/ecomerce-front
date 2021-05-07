const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")

router.get("/empresa",(req,res)=>{
    knex("empresas").select().then(resp=>{
        res.json(resp)
    })
})

module.exports = router