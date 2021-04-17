const Sequelize = require('sequelize')
const connection = require('./database')
const Produto = require('./Produto')

const Imagem = connection.define('imagens',{
    filename:{
        type:Sequelize.STRING,
        allowNull:false
    },
    destination:{
        type:Sequelize.STRING,
        allowNull:false
    },coluna:{
        type:Sequelize.STRING,
        allowNull:true
    },
    linha:{
        type:Sequelize.STRING,
        allowNull:true
    }
})

Imagem.belongsTo(Produto)

// Imagem.sync({force:true}).then(()=>{
//     console.log("Tabela Imagem criada")        
// })

module.exports = Imagem
