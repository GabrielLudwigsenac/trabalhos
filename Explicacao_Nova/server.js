const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Configuração do pool de conexões MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'sistema_usuarios',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testar conexão com o banco de dados
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conectado ao MySQL!');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        cpf VARCHAR(14) NOT NULL UNIQUE,
        senha VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        categoria_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pendente',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS itens_pedido (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pedido_id INT NOT NULL,
        produto_id INT NOT NULL,
        quantidade INT NOT NULL,
        preco_unitario DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      )
    `);
    
    connection.release();
  } catch (err) {
    console.error('Erro ao conectar/configurar o MySQL:', err);
    process.exit(1);
  }
}
testConnection();

// Rotas para Usuários
app.post('/cadastrar-usuario', async (req, res) => {
  try {
    const { nome, usuario, email, cpf, senha } = req.body;
    if (!nome || !usuario || !email || !cpf || !senha) {
      return res.status(400).json({ status: 'Preencha todos os campos.' });
    }
    
    const sql = `INSERT INTO usuarios (nome, usuario, email, cpf, senha) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [nome, usuario, email, cpf, senha]);
    
    res.json({ status: 'Usuário cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'Usuário, email ou CPF já cadastrado.' });
    }
    res.status(500).json({ status: 'Erro ao cadastrar usuário.' });
  }
});

app.get('/listar-usuarios', async (req, res) => {
  try {
    const sql = `SELECT id, nome, usuario, email, cpf FROM usuarios ORDER BY id DESC`;
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ status: 'Erro ao listar usuários.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    const sql = `SELECT id, nome, usuario, email FROM usuarios WHERE usuario = ? AND senha = ?`;
    const [results] = await pool.query(sql, [usuario, senha]);
    
    if (results.length > 0) {
      res.json({ status: 'Login bem-sucedido!', usuario: results[0] });
    } else {
      res.status(401).json({ status: 'Usuário ou senha incorretos.' });
    }
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ status: 'Erro ao fazer login.' });
  }
});

// Rotas para Produtos
app.post('/cadastrar-produto', async (req, res) => {
  try {
    const { nome, descricao, preco, categoria_id } = req.body;
    if (!nome || !preco) {
      return res.status(400).json({ status: 'Preencha nome e preço.' });
    }
    
    const sql = `INSERT INTO produtos (nome, descricao, preco, categoria_id) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [nome, descricao, preco, categoria_id || null]);
    
    res.json({ status: 'Produto cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).json({ status: 'Erro ao cadastrar produto.' });
  }
});


// Rotas para Produtos - Atualizadas
app.get('/listar-produtos', async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.id,
        p.nome,
        p.descricao,
        p.preco,
        c.nome as categoria
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id DESC
    `;
    const [results] = await pool.query(sql);
    
    // Garantir que o preço seja enviado como número
    const produtosFormatados = results.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: Number(produto.preco), // Convertendo para número
      categoria: produto.categoria || 'Sem categoria'
    }));
    
    res.json(produtosFormatados);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ 
      status: 'Erro ao listar produtos.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Rotas para Pedidos
app.post('/criar-pedido', async (req, res) => {
  try {
    const { usuario_id, itens } = req.body;
    if (!usuario_id || !itens || itens.length === 0) {
      return res.status(400).json({ status: 'Dados incompletos para o pedido.' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Inserir pedido
      const [pedidoResult] = await connection.query(
        `INSERT INTO pedidos (usuario_id) VALUES (?)`, 
        [usuario_id]
      );
      const pedido_id = pedidoResult.insertId;

      // Obter preços atuais dos produtos
      const productIds = itens.map(item => item.produto_id);
      const [produtos] = await connection.query(
        `SELECT id, preco FROM produtos WHERE id IN (?)`,
        [productIds]
      );

      const precoMap = produtos.reduce((map, produto) => {
        map[produto.id] = produto.preco;
        return map;
      }, {});

      // Inserir itens do pedido
      const valoresItens = itens.map(item => [
        pedido_id,
        item.produto_id,
        item.quantidade,
        precoMap[item.produto_id] // Usar preço atual do produto
      ]);
      
      await connection.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES ?`,
        [valoresItens]
      );

      await connection.commit();
      res.json({ status: 'Pedido criado com sucesso!', pedido_id });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ status: 'Erro ao processar pedido.' });
  }
});

app.get('/listar-pedidos/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    
    // Obter pedidos do usuário
    const [pedidos] = await pool.query(
      `SELECT p.*, u.nome as usuario_nome 
       FROM pedidos p 
       JOIN usuarios u ON p.usuario_id = u.id 
       WHERE p.usuario_id = ?
       ORDER BY p.data_pedido DESC`,
      [usuario_id]
    );

    if (pedidos.length === 0) return res.json([]);
    
    // Obter itens dos pedidos
    const pedidoIds = pedidos.map(p => p.id);
    const [itens] = await pool.query(
      `SELECT ip.*, pr.nome as produto_nome 
       FROM itens_pedido ip 
       JOIN produtos pr ON ip.produto_id = pr.id 
       WHERE ip.pedido_id IN (?)`,
      [pedidoIds]
    );
    
    const pedidosComItens = pedidos.map(pedido => ({
      ...pedido,
      itens: itens.filter(item => item.pedido_id === pedido.id)
    }));
    
    res.json(pedidosComItens);
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({ status: 'Erro ao listar pedidos.' });
  }
});

// Rotas para Categorias
app.post('/cadastrar-categoria', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    if (!nome) {
      return res.status(400).json({ status: 'Preencha o nome da categoria.' });
    }
    
    const sql = `INSERT INTO categorias (nome, descricao) VALUES (?, ?)`;
    const [result] = await pool.query(sql, [nome, descricao]);
    
    res.json({ status: 'Categoria cadastrada com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('Erro ao cadastrar categoria:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'Categoria já existe.' });
    }
    res.status(500).json({ status: 'Erro ao cadastrar categoria.' });
  }
});

app.get('/listar-categorias', async (req, res) => {
  try {
    const sql = `SELECT * FROM categorias ORDER BY nome`;
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.status(500).json({ status: 'Erro ao listar categorias.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});