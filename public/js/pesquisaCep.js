function limpa_formulário_cep() {
    //Limpa valores do formulário de cep.
    zerarFrete()
    var rua = document.getElementById('rua')
    var bairro = document.getElementById('bairro')
    var cidade = document.getElementById('cidade')
    var uf = document.getElementById('uf')

    rua.value = ("");
    bairro.value = ("");
    cidade.value = ("");
    uf.value = ("");

    rua.classList.remove('is-invalid')
    rua.classList.remove('is-valid')

    bairro.classList.remove('is-invalid')
    bairro.classList.remove('is-valid')

    cidade.classList.remove('is-invalid')
    cidade.classList.remove('is-valid')

    uf.classList.remove('is-invalid')
    uf.classList.remove('is-valid')
    document.getElementById('enderecoValidado').value = false

}

function meu_callback(conteudo) {
    if (!("erro" in conteudo)) {
        //Atualiza os campos com os valores.
        var rua = document.getElementById('rua')
        var bairro = document.getElementById('bairro')
        var cidade = document.getElementById('cidade')
        var uf = document.getElementById('uf')
        var cep = document.getElementById('cep')

        cep.classList.add('is-valid')
        cep.classList.remove('is-invalid')


        rua.value = (conteudo.logradouro);
        rua.classList.remove('is-invalid')
        rua.classList.add('is-valid')

        bairro.value = (conteudo.bairro);
        bairro.classList.remove('is-invalid')
        bairro.classList.add('is-valid')

        cidade.value = (conteudo.localidade);
        cidade.classList.remove('is-invalid')
        cidade.classList.add('is-valid')

        uf.value = (conteudo.uf);
        uf.classList.remove('is-invalid')
        uf.classList.add('is-valid')

        document.getElementById('enderecoValidado').value = true
        verificaCidade()
    } //end if.
    else {
        //CEP não Encontrado.
        limpa_formulário_cep();
        var cep = document.getElementById('cep')
        cep.classList.add('is-invalid')
        cep.classList.remove('is-valid')
        document.getElementById('enderecoValidado').value = false
        // alert("CEP não encontrado.");
    }
}

function pesquisacep(valor) {

    //Nova variável "cep" somente com dígitos.
    var cep = valor.replace(/\D/g, '');

    //Verifica se campo cep possui valor informado.
    if (cep != "") {

        //Expressão regular para validar o CEP.
        var validacep = /^[0-9]{8}$/;

        //Valida o formato do CEP.
        if (validacep.test(cep)) {

            document.getElementById('cep').value = cep.substring(0, 5)
                + "-"
                + cep.substring(5);

            //Preenche os campos com "..." enquanto consulta webservice.
            document.getElementById('rua').value = "...";
            document.getElementById('bairro').value = "...";
            document.getElementById('cidade').value = "...";
            document.getElementById('uf').value = "...";
            document.getElementById('enderecoValidado').value = false

            //Cria um elemento javascript.
            var script = document.createElement('script');

            //Sincroniza com o callback.
            script.src = 'https://viacep.com.br/ws/' + cep + '/json/?callback=meu_callback';

            //Insere script no documento e carrega o conteúdo.
            document.body.appendChild(script);

        } //end if.
        else {
            //cep é inválido.
            limpa_formulário_cep();
            var cep = document.getElementById('cep')
            cep.classList.add('is-invalid')
            cep.classList.remove('is-valid')
            
            // alert("Formato de CEP inválido.");
        }
    } //end if.
    else {
        //cep sem valor, limpa formulário.
        limpa_formulário_cep();
    }
};