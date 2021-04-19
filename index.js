const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const path = require('path')

const connection = require('./DataBases/admin/database')
const Categoria = require("./Databases/admin/Categoria")
const Grade = require("./Databases/admin/Grade")
const G_coluna = require("./DataBases/admin/G_coluna")
const G_linha = require("./DataBases/admin/G_linha")
const Produto = require("./DataBases/admin/Produto")
const Estoque = require("./DataBases/admin/Estoque")
const Preco = require("./DataBases/admin/Preco")


const connectionCL = require('./DataBases/client/databasesCL')
const Cliente = require("./DataBases/client/Cliente")


//usar o EJS como view engine | renderizador de html
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
//Carregamento de arquivos estaticos no express
app.use(express.static(path.join(__dirname, 'public')))
//Carregamento do bodyPerser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get("/", (req, res) => {

})


app.listen(3000, () => {
    console.log("Conexão ok")
})