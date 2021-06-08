const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')
const Cliente = require('./Cliente')

const Carrinho = connectionCL.define('carrinhos',{
    quantidade:{
        type:Sequelize.INTEGER,
        allowNull:true
    },
    status:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    }
})

Carrinho.belongsTo(Cliente)


// Carrinho.sync({force:true}).then(()=>{
//     console.log("Tabela Carrinho criada")        
// })

module.exports = Carrinho
