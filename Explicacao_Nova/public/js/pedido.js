document.addEventListener('DOMContentLoaded', function() {
    let itensPedido = [];
    
    // Carrega usuários para os selects
    carregarUsuariosParaPedidos();
    
    // Configura eventos para a página de criação de pedidos
    if (document.getElementById('formPedido')) {
        configurarCriacaoPedido();
    }
    
    // Configura eventos para a página de listagem de pedidos
    if (document.getElementById('listaPedidos')) {
        const selectUsuario = document.getElementById('usuario_id');
        selectUsuario.addEventListener('change', carregarPedidos);
    }
});

function carregarUsuariosParaPedidos() {
    fetch('/listar-usuarios')
        .then(response => response.json())
        .then(usuarios => {
            // Configura seleção de usuário na página de pedidos
            const selectUsuarioPedido = document.getElementById('usuario_id');
            if (selectUsuarioPedido) {
                selectUsuarioPedido.innerHTML = '<option value="">Selecione um usuário</option>';
                usuarios.forEach(usuario => {
                    const option = document.createElement('option');
                    option.value = usuario.id;
                    option.textContent = `${usuario.nome} (${usuario.email})`;
                    selectUsuarioPedido.appendChild(option);
                });
            }
            
            // Configura seleção de usuário na página de listagem de pedidos
            const selectUsuarioLista = document.getElementById('usuario_id');
            if (selectUsuarioLista) {
                selectUsuarioLista.innerHTML = '<option value="">Selecione um usuário</option>';
                usuarios.forEach(usuario => {
                    const option = document.createElement('option');
                    option.value = usuario.id;
                    option.textContent = `${usuario.nome} (${usuario.email})`;
                    selectUsuarioLista.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
}

function configurarCriacaoPedido() {
    let itensPedido = [];
    
    // Carrega produtos para o select
    fetch('/listar-produtos')
        .then(response => response.json())
        .then(produtos => {
            const selectProduto = document.getElementById('produto_id');
            selectProduto.innerHTML = '<option value="">Selecione um produto</option>';
            
            produtos.forEach(produto => {
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = `${produto.nome} - R$ ${Number(produto.preco).toFixed(2)}`;
                option.dataset.preco = produto.preco;
                selectProduto.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar produtos:', error);
        });

    // Adiciona item ao pedido
    const btnAdicionar = document.getElementById('btnAdicionar');
    btnAdicionar.addEventListener('click', function() {
        const produtoSelect = document.getElementById('produto_id');
        const produtoId = produtoSelect.value;
        const produtoNome = produtoSelect.options[produtoSelect.selectedIndex].text.split(' - ')[0];
        const precoUnitario = parseFloat(produtoSelect.options[produtoSelect.selectedIndex].dataset.preco);
        const quantidade = parseInt(document.getElementById('quantidade').value) || 1;
        
        if (!produtoId || quantidade < 1) {
            alert('Selecione um produto e uma quantidade válida');
            return;
        }
        
        // Verifica se o produto já está no pedido
        const itemExistente = itensPedido.find(item => item.produto_id == produtoId);
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            itensPedido.push({
                produto_id: parseInt(produtoId),
                produto_nome: produtoNome,
                preco_unitario: precoUnitario,
                quantidade: quantidade
            });
        }
        
        atualizarTabelaItens();
        produtoSelect.value = '';
        document.getElementById('quantidade').value = 1;
    });

    // Remove item do pedido
    const tabelaItens = document.getElementById('tabelaItens');
    tabelaItens.addEventListener('click', function(e) {
        if (e.target.classList.contains('remover-item')) {
            const produtoId = parseInt(e.target.dataset.produtoId);
            itensPedido = itensPedido.filter(item => item.produto_id !== produtoId);
            atualizarTabelaItens();
        }
    });

    // Finaliza pedido
    const formPedido = document.getElementById('formPedido');
    formPedido.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usuarioId = document.getElementById('usuario_id').value;
        if (!usuarioId || itensPedido.length === 0) {
            alert('Selecione um usuário e adicione itens ao pedido');
            return;
        }
        
        const pedido = {
            usuario_id: parseInt(usuarioId),
            itens: itensPedido.map(item => ({
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario
            }))
        };
        
        fetch('/criar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pedido)
        })
        .then(response => response.json())
        .then(data => {
            const mensagem = document.getElementById('mensagem');
            mensagem.textContent = data.status;
            mensagem.style.color = data.pedido_id ? 'green' : 'red';
            
            if (data.pedido_id) {
                itensPedido = [];
                atualizarTabelaItens();
                formPedido.reset();
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            document.getElementById('mensagem').textContent = 'Erro ao criar pedido.';
        });
    });

    function atualizarTabelaItens() {
        const tbody = document.querySelector('#tabelaItens tbody');
        tbody.innerHTML = '';
        
        let total = 0;
        
        itensPedido.forEach(item => {
            const subtotal = item.preco_unitario * item.quantidade;
            total += subtotal;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.produto_nome}</td>
                <td>R$ ${item.preco_unitario.toFixed(2)}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${subtotal.toFixed(2)}</td>
                <td><button type="button" class="remover-item" data-produto-id="${item.produto_id}">Remover</button></td>
            `;
            tbody.appendChild(tr);
        });
        
        const totalPedido = document.getElementById('totalPedido');
        if (totalPedido) {
            totalPedido.textContent = `R$ ${total.toFixed(2)}`;
        }
    }
}

function carregarPedidos() {
    const usuarioId = document.getElementById('usuario_id').value;
    if (!usuarioId) {
        document.getElementById('listaPedidos').innerHTML = '<p>Selecione um usuário para visualizar os pedidos.</p>';
        return;
    }
    
    const loadingElement = document.createElement('div');
    loadingElement.textContent = 'Carregando pedidos...';
    loadingElement.className = 'loading';
    
    const listaPedidos = document.getElementById('listaPedidos');
    listaPedidos.innerHTML = '';
    listaPedidos.appendChild(loadingElement);
    
    fetch(`/listar-pedidos/${usuarioId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(pedidos => {
            listaPedidos.innerHTML = '';
            
            if (pedidos.length === 0) {
                listaPedidos.innerHTML = '<p>Nenhum pedido encontrado para este usuário.</p>';
                return;
            }
            
            pedidos.forEach(pedido => {
                const pedidoDiv = document.createElement('div');
                pedidoDiv.className = 'pedido';
                
                // Formata a data do pedido
                const dataPedido = new Date(pedido.data_pedido);
                const dataFormatada = dataPedido.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                // Adiciona classe de status para estilização
                const statusClass = `status-${pedido.status.toLowerCase()}`;
                
                pedidoDiv.innerHTML = `
                    <h3>Pedido #${pedido.id} - ${dataFormatada}</h3>
                    <p><strong>Status:</strong> <span class="${statusClass}">${pedido.status}</span></p>
                    <p><strong>Cliente:</strong> ${pedido.usuario_nome}</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Preço Unitário</th>
                                <th>Quantidade</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pedido.itens.map(item => `
                                <tr>
                                    <td>${item.produto_nome}</td>
                                    <td>R$ ${Number(item.preco_unitario).toFixed(2)}</td>
                                    <td>${item.quantidade}</td>
                                    <td>R$ ${(Number(item.preco_unitario) * item.quantidade).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                                <td>R$ ${pedido.itens.reduce((total, item) => 
                                    total + (Number(item.preco_unitario) * item.quantidade), 0).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                `;
                
                listaPedidos.appendChild(pedidoDiv);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar pedidos:', error);
            listaPedidos.innerHTML = `
                <div class="error-message">
                    Erro ao carregar pedidos: ${error.message}
                </div>
            `;
        });
}