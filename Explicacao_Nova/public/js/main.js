// public/js/main.js (shared functions)
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('tabelaUsuarios')) {
        carregarUsuarios();
    }
    // Add similar checks for other pages if needed
});

function carregarUsuarios() {
    fetch('/listar-usuarios')
        .then(response => response.json())
        .then(usuarios => {
            const tbody = document.querySelector('#tabelaUsuarios tbody');
            tbody.innerHTML = '';
            
            usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${usuario.id}</td>
                    <td>${usuario.nome}</td>
                    <td>${usuario.usuario}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.cpf}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
}