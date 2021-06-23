function deleteItem() {
    return confirm("Tem certeza que deseja remover item da compra?")
}

function somarTotais() {
    var quantidadeTotal = document.getElementById("quantidadeTotal").value
    var precoTot = 0
    for (var y = 0; y < quantidadeTotal; y++) {
        var precoTotalItem = document.getElementById(`price${y}`).dataset.total

        var precoTotAtual = document.getElementById("precoTotal").dataset.valor

        precoTot = parseInt(precoTot) + parseInt(precoTotalItem)
        document.getElementById("precoTotal").innerHTML = precoTot.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
        document.getElementById("precoTotal").dataset.valor = precoTot
        document.getElementById("valorTotal").innerHTML = precoTot.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
        document.getElementById("valorTotal").dataset.valor = precoTot
    }
}

function diminuir(x) {
    var id = `btnValor${x}`
    var quantidade = document.getElementById(id).innerHTML

    var valor = document.getElementById(`precoVenda${x}`).dataset.valor


    if (quantidade > 1) {
        document.getElementById(id).innerHTML = parseInt(quantidade) - 1
        document.getElementById(id).value = parseInt(quantidade) - 1

        var qtd = document.getElementById(id).value
        var preco = qtd * valor

        document.getElementById(`price${x}`).innerHTML = preco.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
        document.getElementById(`price${x}`).dataset.total = parseFloat(preco)
    }
    somarTotais()
}

function adicionar(x) {
    var id = `btnValor${x}`
    var quantidade = document.getElementById(id).innerHTML

    var valor = document.getElementById(`precoVenda${x}`).dataset.valor

    if (quantidade >= 1) {
        document.getElementById(id).innerHTML = parseInt(quantidade) + 1
        document.getElementById(id).value = parseInt(quantidade) + 1

        var qtd = document.getElementById(id).value
        var preco = qtd * valor

        document.getElementById(`price${x}`).innerHTML = preco.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
        document.getElementById(`price${x}`).dataset.total = preco
    }
    somarTotais()
}