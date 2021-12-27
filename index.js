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

const carrinhoController = require("./controller/carrinhoController")
const empresaController = require("./controller/empresaController")
const produtoController = require("./controller/produtoControler")
const clienteController = require("./controller/userController")
const categoriaControler = require("./controller/categoriaController")
const compraControler = require("./controller/compraController")
const entregaControler = require("./controller/entregaController")

const connectionCL = require('./Databases/client/databasesCL')

MercadoPago.configure({
    sandbox: true,
    access_token: 'TEST-1254504299447071-061611-ac2150294a43f6a4d65d10f6f66512f8-257758072'
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ storage })

const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? true : false
});

const pool2 = new Pool({
    connectionString: process.env.HEROKU_POSTGRESQL_PUCE_URL,
    ssl: process.env.HEROKU_POSTGRESQL_PUCE_URL ? true : false
});

pool.connect();
pool2.connect();

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


app.post("/teste",upload.any("arquivo"),(req,res)=>{
    var file = req.body
    console.log(file)
    
    res.json({resp:"file"})
})

app.listen(process.env.PORT || 3000, () => {
    console.log("Conexão ok")
})