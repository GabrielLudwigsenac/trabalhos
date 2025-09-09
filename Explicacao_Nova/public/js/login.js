// public/js/login.js
document.getElementById('formLogin').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const login = {
        usuario: document.getElementById('usuario').value,
        senha: document.getElementById('senha').value
    };

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(login)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('mensagem').textContent = data.status;
        if (data.usuario) {
            // Login successful - you could redirect or store user data
            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
            alert(`Bem-vindo, ${data.usuario.nome}!`);
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('mensagem').textContent = 'Erro ao fazer login.';
    });
});