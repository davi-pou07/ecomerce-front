const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const session = require("express-session")
const path = require('path')

const knex = require('./DataBases/admin/databases')

const Carrinho = require("./Databases/client/Carrinho")
const CodItens = require("./Databases/client/CodItens")

const carrinhoController = require("./controller/carrinhoController")
const empresaController = require("./controller/empresaController")
const produtoController = require("./controller/produtoControler")
const clienteController = require("./controller/userController")

const connectionCL = require('./DataBases/client/databasesCL')
const Cliente = require("./DataBases/client/Cliente")

app.use(session({
    secret: "sdfsdfsdfgdfgfgh",
    cookie: { maxAge: 260000000000 }
}))


//usar o EJS como view engine | renderizador de html
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
//Carregamento de arquivos estaticos no express
app.use(express.static(path.join(__dirname, 'public')))
//Carregamento do bodyPerser
app.use(bodyParser.urlencoded({ extended: false, limit:"50mb" }))
app.use(bodyParser.json({limit: '50mb'}))

app.use("/", empresaController)
app.use("/", produtoController)
app.use("/", carrinhoController)
app.use("/", clienteController)


app.get("/", (req, res) => {
    knex("produtos").select().where('status',true).then(produtos => {
        knex("categorias").select().where('status',true).limit(6).then(categorias => {
            knex("precos").select().then(precos =>{
                knex("imagens").select().then(imagens =>{
                    res.render("index", { produtos: produtos, categorias: categorias, precos:precos, imagens:imagens })
                })
            })
        })
    })
})



app.listen(3000, () => {
    console.log("Conexão ok")
})