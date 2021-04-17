const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')
const Carrinho = require('./Carrinho')

const CodItens = connectionCL.define('coditens',{
    produtoId:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    quantidade:{
        type:Sequelize.STRING,
        allowNull:false
    },
    estoqueId:{
        type:Sequelize.INTEGER,
        allowNull:false
    }
    
})

CodItens.belongsTo(Carrinho)

CodItens.sync({force:true}).then(()=>{
    console.log("Tabela CodItens criada")        
})

module.exports = CodItens
