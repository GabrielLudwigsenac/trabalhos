// public/js/usuario.js
document.getElementById('formUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const usuario = {
        nome: document.getElementById('nome').value,
        usuario: document.getElementById('usuario').value,
        email: document.getElementById('email').value,
        cpf: document.getElementById('cpf').value,
        senha: document.getElementById('senha').value
    };

    fetch('/cadastrar-usuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('mensagem').textContent = data.status;
        if (data.id) {
            document.getElementById('formUsuario').reset();
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('mensagem').textContent = 'Erro ao cadastrar usuário.';
    });
});