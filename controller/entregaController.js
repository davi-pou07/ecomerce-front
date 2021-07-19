const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const Carrinho = require("../Databases/client/Carrinho")
const Cliente = require("../Databases/client/Cliente")
const auth = require("../middlewares/adminAuth")

router.post("/entrgea/adicionar",(req,res))

module.exports = router