// public/js/categoria.js
document.getElementById('formCategoria').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const categoria = {
        nome: document.getElementById('nome').value,
        descricao: document.getElementById('descricao').value
    };

    fetch('/cadastrar-categoria', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoria)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('mensagem').textContent = data.status;
        if (data.id) {
            document.getElementById('formCategoria').reset();
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('mensagem').textContent = 'Erro ao cadastrar categoria.';
    });
});