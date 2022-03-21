const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')

const Solicitacao = connectionCL.define('solicitacoes',{
    titulo:{
        type:Sequelize.STRING,
        allowNull:false
    },
    solicitacao:{
        type:Sequelize.STRING,
        allowNull:false
    },
    clienteId:{
        type:Sequelize.INTEGER,
        allowNull:false
    }
})



// Solicitacao.sync({force:true}).then(()=>{
//     console.log("Tabela Solicitacao criada")        
// })

module.exports = Solicitacao
