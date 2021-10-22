const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')

const Cliente = connectionCL.define('clientes',{
    nome:{
        type:Sequelize.STRING,
        allowNull:false
    },
    status:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    },
    cpf:{
        type:Sequelize.STRING,
        allowNull:true
    },
    numero:{
        type:Sequelize.STRING,
        allowNull:true
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
        allowNull:true
    },
    foto:{
        type:Sequelize.TEXT,
        allowNull:true 
    },
    isWhats:{
        type:Sequelize.STRING,
        allowNull:true
    }
})


// Cliente.sync({force:true}).then(()=>{
//     console.log("Tabela Cliente criada")        
// })

module.exports = Cliente
