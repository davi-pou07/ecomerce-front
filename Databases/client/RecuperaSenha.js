const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')
const Cliente = require('./Cliente')

const RecuperaSenha = connectionCL.define('recuperasenhas',{
    uniqid:{
        type:Sequelize.STRING,
        allowNull:false
    },
    status:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    },
    aprovado:{
        type:Sequelize.BOOLEAN,
        allowNull:true
    }
})

RecuperaSenha.belongsTo(Cliente)


// RecuperaSenha.sync({force:true}).then(()=>{
//     console.log("Tabela RecuperaSenha criada")        
// })

module.exports = RecuperaSenha
