const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')

const Cliente = connectionCL.define('clientes',{
    nome:{
        type:Sequelize.STRING,
        allowNull:false
    },
    sobrenome:{
        type:Sequelize.STRING,
        allowNull:false
    },
    status:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    },
    cpf:{
        type:Sequelize.STRING,
        allowNull:false
    },
    celular:{
        type:Sequelize.STRING,
        allowNull:false
    },
    email:{
        type:Sequelize.STRING,
        allowNull:false
    },
    validado:{
        type:Sequelize.BOOLEAN,
        allowNull:true
    },
    senha:{
        type:Sequelize.STRING,
        allowNull:false
    },
    dataNasc:{
        type:Sequelize.DATE,
        allowNull:false
    }
})


// Cliente.sync({force:true}).then(()=>{
//     console.log("Tabela Cliennte criada")        
// })

module.exports = Cliente
