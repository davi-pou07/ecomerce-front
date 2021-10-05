function deleteItem() {
    return confirm("Tem certeza que deseja remover item da compra?")
}

function somarTotais() {
    var quantidadeTotal = document.getElementById("quantidadeTotal").value
    var valorDesconto = document.getElementById("valorDesconto").dataset.valor
    var valorFrete = document.getElementById("valorFrete").dataset.valor
    var precoTot = 0
    for (var y = 0; y < quantidadeTotal; y++) {
        var precoTotalItem = document.getElementById(`price${y}`).dataset.total

        precoTot = parseFloat(precoTot) + parseFloat(precoTotalItem)
        document.getElementById("precoTotal").innerHTML = precoTot.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
        document.getElementById("precoTotal").dataset.valor = precoTot
    }
    var precoTotal = (parseFloat(precoTot) + parseFloat(valorFrete)) - parseFloat(valorDesconto)
    document.getElementById("valorTotal").innerHTML = precoTotal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
    document.getElementById("valorTotal").dataset.valor = precoTotal
    document.getElementById("valorTotalPix").innerHTML = precoTotal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
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
}