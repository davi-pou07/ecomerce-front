require('dotenv').config()

const express = require("express")
const app = express()
const cors = require("cors")
app.use(cors())
const bodyParser = require("body-parser")
const session = require("express-session")
const path = require('path')
const MercadoPago = require("mercadopago")
const knex = require('./Databases/admin/databases')

const multer = require('multer')
const fs = require('fs')

const Cliente = require("./Databases/client/Cliente")
const Carrinho = require("./Databases/client/Carrinho")
const CodItens = require("./Databases/client/CodItens")
const Endereco = require("./Databases/client/Endereco")
const RecuperaSenha = require("./Databases/client/RecuperaSenha")
const Solicitacao = require("./Databases/client/Solicitacao")

const carrinhoController = require("./controller/carrinhoController")
const empresaController = require("./controller/empresaController")
const produtoController = require("./controller/produtoControler")
const clienteController = require("./controller/userController")
const categoriaControler = require("./controller/categoriaController")
const compraControler = require("./controller/compraController")
const entregaControler = require("./controller/entregaController")
const atualizaController = require("./controller/atualizaController")
const sacController = require("./controller/sacController")

const connectionCL = require('./Databases/client/databasesCL')

MercadoPago.configure({
    sandbox: true,
    access_token: process.env.TOCKENMERCADOPAGO
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var loja = req.body.loja
        console.log(req.body)
        console.log(loja)
        if (!fs.existsSync(`./public/upload`)){
            fs.mkdirSync(`./public/upload`);
        }
        if (!fs.existsSync(`./public/upload/${loja}`)){
            fs.mkdirSync(`./public/upload/${loja}`);
        }
        cb(null, `./public/upload/${loja}`)
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname)
    }
})

const upload = multer({ storage })


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
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }))
app.use(bodyParser.json({ limit: '50mb' }))

app.use("/", empresaController)
app.use("/", produtoController)
app.use("/", carrinhoController)
app.use("/", clienteController)
app.use("/", categoriaControler)
app.use("/", compraControler)
app.use("/", entregaControler)
app.use("/", atualizaController)
app.use("/", sacController)



app.get("/", async (req, res) => {
    try {
        var produtosIds = []
        var produtos = await knex("produtos").select("id", "nome").where('status', true).orderBy('categoriaId')
        produtos.forEach(produto => {
            produtosIds.push(produto.id)
        });
        var categorias = await knex("categorias").select("destaque", "status", "titulo", "id").where('status', true).limit(6)
        var precos = await knex("precos").select("produtoId", "desconto", "venda")
        var imagens = await knex("imagens").select("produtoId", "imagem").whereIn("produtoId", produtosIds)
        var banners = await knex("banners").select("img").where({ status: true, destaque: true })

        res.render("index", { produtos: produtos, categorias: categorias, precos: precos, imagens: imagens, banners: banners })

    } catch (err) {
        console.log(err)
        res.json(err)
    }
})

app.get("/produtos/todos", async (req, res) => {
    
    try {
        var produtosIds = []
        var produtos = await knex("produtos").select("id", "nome").where('status', true).orderBy('categoriaId')
        produtos.forEach(produto => {
            produtosIds.push(produto.id)
        });
        var categorias = await knex("categorias").select("destaque", "status", "titulo", "id").where('status', true)
        var precos = await knex("precos").select("produtoId", "desconto", "venda")
        var imagens = await knex("imagens").select("produtoId", "imagem").whereIn("produtoId", produtosIds)
        var banners = await knex("banners").select("img").where({ status: true, destaque: true })

        res.render("produtos_todos", { produtos: produtos, categorias: categorias, precos: precos, imagens: imagens, banners: banners })

    } catch (err) {
        console.log(err)
        res.json(err)
    }
})

app.listen(process.env.PORT || 3000, () => {
    console.log("Conexão ok")
})