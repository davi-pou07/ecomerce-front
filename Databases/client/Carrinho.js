const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')
const Cliente = require('./Cliente')
const CodItens = require('./CodItens')

const Carrinho = connectionCL.define('carrinho',{
    quantidade:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    status:{
        type:Sequelize.STRING,
        allowNull:false
    }
})

Carrinho.belongsTo(Cliente)
Carrinho.belongsTo(CodItens)

Carrinho.sync({force:true}).then(()=>{
    console.log("Tabela Carrinho criada")        
})

module.exports = Carrinho
