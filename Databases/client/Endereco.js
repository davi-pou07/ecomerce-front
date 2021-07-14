const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')
const Carrinho = require('./Carrinho')

const Endereco = connectionCL.define('enderecos', {
    cep: {
        type: Sequelize.STRING,
        allowNull: false
    }, rua: {
        type: Sequelize.STRING,
        allowNull: false
    }, numero: {
        type: Sequelize.INTEGER,
        allowNull: true
    }, bairro: {
        type: Sequelize.STRING,
        allowNull: false
    }, cidade: {
        type: Sequelize.STRING,
        allowNull: false
    }, estado: {
        type: Sequelize.STRING,
        allowNull: false
    },
    complemento:{
        type:Sequelize.STRING,
        allowNull:true
    }
    })

Endereco.belongsTo(Carrinho)


// Endereco.sync({force:true}).then(()=>{
//     console.log("Tabela Endereco criada")        
// })

module.exports = Endereco
