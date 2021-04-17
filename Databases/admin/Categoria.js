const Sequelize = require('sequelize')
const connection = require('./database')

const Categoria = connection.define('categorias',{
    
    titulo:{
        type:Sequelize.STRING,
        allowNull:false
    },
    descricao:{
        type:Sequelize.TEXT,
        allowNull:true
    },
    destaque:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    },
    status:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    }
})
// Categoria.sync({force:false}).then(()=>{
//     console.log("Tabela Categoria criada");
// })

module.exports = Categoria