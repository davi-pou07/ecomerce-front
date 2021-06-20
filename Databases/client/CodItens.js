const Sequelize = require('sequelize')
const connectionCL = require('./databasesCL')
const Carrinho = require('./Carrinho')

const Coditens = connectionCL.define('coditens',{
    produtoId:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    quantidade:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    refcoluna:{
        type:Sequelize.INTEGER,
        allowNull:true
    },
    reflinha:{
        type:Sequelize.INTEGER,
        allowNull:true
    },
    precoUnit:{
        type:Sequelize.FLOAT,
        allowNull:false
    },
    precoTotalItem:{
        type:Sequelize.FLOAT,
        allowNull:false
    }
})

Coditens.belongsTo(Carrinho);

// Coditens.sync({force:true}).then(()=>{
//     console.log("Tabela CodItens criada")        
// })

module.exports = Coditens
