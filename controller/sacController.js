const express = require('express')
const router = express.Router()
const knex = require("../Databases/admin/databases")
const auth = require("../middlewares/adminAuth")


router.get("/sac", async (req, res) => {
    res.render("sac/sac")
})

router.post("/sac/solicitacao",async(req,res)=>{
    var {titulo,solicitacao} = req.body
    var user = req.session.cli
    if (user != undefined) {
        if (titulo != '' & solicitacao != '') {
            knex("solicitacoes").insert({
                titulo:titulo,
                solicitacao:solicitacao,
                userId:user.id
            }).then(()=>{
                res.json({resp:"Solicitação aberta com sucesso, gentileza aguardar retorno!"})
            }).catch(err =>{
                console.log(err)
                res.json({erroId:3,erro:"Ocorreu um erro ao abrir solicitação, gentileza tentar novamente. Caso o erro persistir entre em contato atraves de outro meio de atendimento passando essa informação"})
            })
        } else {
            res.json({erroId:2,erro:"Dados não podem estar vazios, gentileza preencha as informações"})
        }
    } else {
        res.json({erroId:1,erro:"Nennhum usuario logado, gentileza realizar Login"})
    }
})

module.exports = router