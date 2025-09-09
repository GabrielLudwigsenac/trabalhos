// public/js/produto.js
document.addEventListener('DOMContentLoaded', function() {
  // Verifica se estamos na página de listagem
  if (document.getElementById('tabelaProdutos')) {
    // Carrega os produtos imediatamente
    carregarProdutos();
    
    // Adiciona botão de recarregar
    const btnRecarregar = document.createElement('button');
    btnRecarregar.textContent = 'Recarregar Produtos';
    btnRecarregar.className = 'btn-recarregar';
    btnRecarregar.addEventListener('click', carregarProdutos);
    
    const tabela = document.getElementById('tabelaProdutos');
    tabela.parentNode.insertBefore(btnRecarregar, tabela);
  }
});

function carregarProdutos() {
  const loadingElement = document.createElement('div');
  loadingElement.textContent = 'Carregando produtos...';
  loadingElement.className = 'loading';
  
  const tbody = document.querySelector('#tabelaProdutos tbody');
  tbody.innerHTML = '';
  tbody.appendChild(loadingElement);

  fetch('/listar-produtos')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(produtos => {
      tbody.innerHTML = '';
      
      if (produtos.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td colspan="5" class="empty-message">
            Nenhum produto cadastrado
          </td>
        `;
        tbody.appendChild(tr);
        return;
      }

      produtos.forEach(produto => {
        const tr = document.createElement('tr');
        // Convertendo o preço para número antes de usar toFixed
        const preco = Number(produto.preco) || 0;
        tr.innerHTML = `
          <td>${produto.id}</td>
          <td>${produto.nome}</td>
          <td>${produto.descricao || '-'}</td>
          <td>R$ ${preco.toFixed(2)}</td>
          <td>${produto.categoria || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar produtos:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="error-message">
            Erro ao carregar produtos: ${error.message}
          </td>
        </tr>
      `;
    });
}