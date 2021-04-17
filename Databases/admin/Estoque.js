const Sequelize = require('sequelize')
const connection = require('./database')
const Grade = require('./Grade')
const Produto =  require("./Produto")

const Estoque = connection.define('estoques',{
    quantidade:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    coluna:{
        type:Sequelize.STRING,
        allowNull:true
    },
    linha:{
        type:Sequelize.STRING,
        allowNull:true
    }
})

Estoque.belongsTo(Produto)

// Estoque.sync({force:true}).then(()=>{
//     console.log("Tabela Estoque criada")        
// })

module.exports = Estoque
