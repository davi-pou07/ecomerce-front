const express = require('express')
const router = express.Router()
const auth = require("../middlewares/adminAuth")
const Solicitacao = require("../Databases/client/Solicitacao")

router.get("/sac", async (req, res) => {
    res.render("sac/sac")
})

router.post("/sac/solicitacao",async(req,res)=>{
    var {titulo,solicitacao} = req.body
    var user = req.session.cli
    if (user != undefined) {
        if (titulo != '' & solicitacao != '') {
            Solicitacao.create({
                titulo:titulo,
                solicitacao:solicitacao,
                clienteId:user.id
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