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
        type:Sequelize.STRING,
        allowNull:false
    },
    foto:{
        type:Sequelize.TEXT,
        allowNull:true 
    }
})


// Cliente.sync({force:true}).then(()=>{
//     console.log("Tabela Cliente criada")        
// })

module.exports = Cliente
